import Queue from '~/helpers/queue';
import {WorkerInfo, Task} from '~/helpers/workerFtTask';
import {TaskEventEmmitter, TaskEvent} from '../events/taskingEvent';
import {CloudProvider} from 'packunpackservice';
import {MasterError, MasterErrorCode} from '~/errorHandling/masterError';

interface CloudManagerI {
    addNewTask(task: Task): any;
    updateSuccessTask(task: Task): any;
    updateFailureTask(task: Task): any;
    getAvaiTask(cloudProvider: CloudProvider): Task | undefined;
}

export default class CloudManager implements CloudManagerI {
    static instances: CloudManager;
    private TasksMap: Map<CloudProvider, Queue<Task>>;
    private workersMap: Map<CloudProvider, WorkerInfo>;
    private eventEmmiter: TaskEventEmmitter;
    // TODO
    // retrytime: number time retry to process the upload task
    // list success task: list sucessfull task
    // list failed task: list failed task
    // totaltask: the total task was executed

    private constructor() {
        this.eventEmmiter = new TaskEventEmmitter();
        this.TasksMap = new Map();
        this.workersMap = new Map();
        // init uploadTask map
        this.TasksMap.set(CloudProvider.AWS, new Queue<Task>());
        this.TasksMap.set(CloudProvider.GOOGLE, new Queue<Task>());
        this.TasksMap.set(CloudProvider.AZURE, new Queue<Task>());
        // init worker map
        this.workersMap.set(
            CloudProvider.AWS,
            new WorkerInfo(CloudProvider.AWS)
        );
        this.workersMap.set(
            CloudProvider.GOOGLE,
            new WorkerInfo(CloudProvider.GOOGLE)
        );
        this.workersMap.set(
            CloudProvider.AZURE,
            new WorkerInfo(CloudProvider.AZURE)
        );
    }

    // singleton pattern
    static getInstance() {
        if (!this.instances) {
            this.instances = new CloudManager();
        }
        return this.instances;
    }

    public getEventEmmiter() {
        return this.eventEmmiter;
    }

    public addNewTask(task: Task): any {
        console.log('CLOUD MANAGER:: new task arrived, push the queue');
        console.log(task);
        const cloudConfig = task.cloudConfig;
        const cloudProvider = cloudConfig.type;
        let cloudQueue = this.TasksMap.get(cloudProvider);
        if (!cloudQueue) {
            cloudQueue = new Queue<Task>();
        }
        cloudQueue.push_back(task);
        if (this.isAvaiWorker(cloudProvider)) {
            const avaiTask = this.getAvaiTask(cloudProvider);
            // if has task, emit event 'NewTask'
            if (avaiTask) {
                console.log(
                    'CLOUD MANAGER:: worker is avail and task is avail ==> emit event New Task'
                );
                // emit event 'NewTask'
                this.eventEmmiter.emit(TaskEvent.NewTask, avaiTask);
            }
        }
    }

    // trigger before fork new child to start uploadTask
    public startProcessingTask(cloudProvider: CloudProvider) {
        if (!this.isAvaiWorker(cloudProvider)) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E01,
                'Worker is busy now'
            );
        }
        const worker = this.getWorker(cloudProvider);
        worker.startNewTask();
    }

    public updateSuccessTask(task: Task): any {
        const cloudConfig = task.cloudConfig;
        const cloudProvider = cloudConfig.type;
        const frontTask = this.getFrontTask(cloudConfig.type);
        if (!frontTask) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E00,
                'No Front Task in the queue'
            );
        }
        // check the id is correct front task
        if (task.id != frontTask.id) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E02,
                'Invalid task handling'
            );
        } else {
            this.removeFrontTask(cloudProvider);
        }
        // update worker infor
        const worker = this.getWorker(cloudProvider);
        worker.successUpdate();

        // check avai task for this provider
        const avaiTask = this.getAvaiTask(cloudProvider);
        if (avaiTask) {
            // if has task, emit event 'NewTask'
            console.log(
                'CLOUD MANAGER:: SUCCESS, worker is free and task is available ==> emit event New Task'
            );
            console.log('CLOUD MANAGER :: Available Task infor');
            console.log(avaiTask);
            this.eventEmmiter.emit(TaskEvent.NewTask, avaiTask);
        }
    }
    public updateFailureTask(task: Task): any {
        const cloudConfig = task.cloudConfig;
        const cloudProvider = cloudConfig.type;
        const frontTask = this.getFrontTask(cloudProvider);
        if (!frontTask) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E00,
                'No Front Task in the queue'
            );
        }
        // check the id is correct front task
        if (task.id != frontTask.id) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E02,
                'Invalid task handling'
            );
        } else {
            if (!frontTask.shouldRetry()) {
                this.removeFrontTask(cloudProvider);
            }
        }
        // update worker infor
        const worker = this.getWorker(cloudProvider);
        worker.failureUpdate();

        // check avai task for this provider
        const avaiTask = this.getAvaiTask(cloudProvider);
        if (avaiTask) {
            // if has task, emit event 'NewTask'
            console.log(
                'CLOUD MANAGER:: FAILURE worker is free and task is available ==> emit event New Task'
            );
            console.log('CLOUD MANAGER :: Available Task infor');
            console.log(avaiTask);
            this.eventEmmiter.emit(TaskEvent.NewTask, avaiTask);
        }
    }
    public getAvaiTask(cloudProvider: CloudProvider): Task | undefined {
        return this.getFrontTask(cloudProvider);
    }

    private getFrontTask(cloudProvider: CloudProvider) {
        let taskQueue = this.TasksMap.get(cloudProvider);
        console.log(taskQueue);
        if (!taskQueue) {
            taskQueue = new Queue<Task>();
            return undefined;
        }
        return taskQueue.front();
    }

    private getWorker(cloudProvider: CloudProvider) {
        let worker = this.workersMap.get(cloudProvider);
        if (!worker) {
            worker = new WorkerInfo(cloudProvider);
        }
        return worker;
    }

    public isAvaiWorker(cloudProvider: CloudProvider) {
        const worker = this.getWorker(cloudProvider);
        return worker.isAvai();
    }

    private removeFrontTask(cloudProvider: CloudProvider) {
        const taskQueue = this.TasksMap.get(cloudProvider);
        if (!taskQueue) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E00,
                `No queue for ${cloudProvider}`
            );
        }
        if (taskQueue.isEmpty()) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E00,
                `No task In queue`
            );
        }
        taskQueue.pop_front();
    }

    printInfo() {
        this.workersMap.forEach((worker, provider) => {
            worker.printInfo();
        });
    }
}
