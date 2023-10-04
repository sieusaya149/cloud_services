import Queue from '~/helpers/queue';
import {UploadTask, WorkerInfo} from '~/helpers/workerFtTask';
import {TaskEventEmmitter, TaskEvent} from './taskEvent.services';
import {CloudProvider} from 'packunpackservice';

interface CloudManagerI {
    addNewTask(uploadTask: UploadTask): any;
    updateSuccessTask(uploadTask: UploadTask): any;
    updateFailureTask(uploadTask: UploadTask): any;
    getAvaiTask(cloudProvider: CloudProvider): UploadTask | undefined;
}

export default class CloudManager implements CloudManagerI {
    static instances: CloudManager;
    private uploadTasksMap: Map<CloudProvider, Queue<UploadTask>>;
    private workersMap: Map<CloudProvider, WorkerInfo>;
    private eventEmmiter: TaskEventEmmitter;
    // TODO
    // retrytime: number time retry to process the upload task
    // list success task: list sucessfull task
    // list failed task: list failed task
    // totaltask: the total task was executed

    private constructor() {
        this.eventEmmiter = new TaskEventEmmitter();
        this.uploadTasksMap = new Map();
        this.workersMap = new Map();
        // init uploadTask map
        this.uploadTasksMap.set(CloudProvider.AWS, new Queue<UploadTask>());
        this.uploadTasksMap.set(CloudProvider.GOOGLE, new Queue<UploadTask>());
        this.uploadTasksMap.set(CloudProvider.AZURE, new Queue<UploadTask>());
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

    public addNewTask(uploadTask: UploadTask): any {
        console.log('CLOUD MANAGER:: new task arrived, push the queue');
        const cloudConfig = uploadTask.cloudConfig;
        const cloudProvider = cloudConfig.type;
        let cloudQueue = this.uploadTasksMap.get(cloudProvider);
        if (!cloudQueue) {
            cloudQueue = new Queue<UploadTask>();
        }
        cloudQueue.push_back(uploadTask);
        console.log(uploadTask);
        if (this.isAvaiWorker(cloudConfig.type)) {
            const avaiTask = this.getAvaiTask(cloudConfig.type);
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
            throw new Error('Worker is busy now');
        }
        const worker = this.getWorker(cloudProvider);
        worker.startNewTask();
    }

    public updateSuccessTask(uploadTask: UploadTask): any {
        const cloudConfig = uploadTask.cloudConfig;
        const cloudProvider = cloudConfig.type;
        const frontTask = this.getFrontTask(cloudConfig.type);
        if (!frontTask) {
            throw new Error('No Front Task in the queue');
        }
        // check the id is correct front task
        if (uploadTask.id != frontTask.id) {
            throw new Error('Invalid task was handled');
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
    public updateFailureTask(uploadTask: UploadTask): any {
        const cloudConfig = uploadTask.cloudConfig;
        const cloudProvider = cloudConfig.type;
        const frontTask = this.getFrontTask(cloudProvider);
        if (!frontTask) {
            throw new Error('No Front Task in the queue');
        }
        // check the id is correct front task
        if (uploadTask.id != frontTask.id) {
            throw new Error('Invalid task was handled');
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
    public getAvaiTask(cloudProvider: CloudProvider): UploadTask | undefined {
        return this.getFrontTask(cloudProvider);
    }

    private getFrontTask(cloudProvider: CloudProvider) {
        let taskQueue = this.uploadTasksMap.get(cloudProvider);
        if (!taskQueue) {
            taskQueue = new Queue<UploadTask>();
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
        const taskQueue = this.uploadTasksMap.get(cloudProvider);
        if (!taskQueue) {
            throw new Error(`No queue for ${cloudProvider}`);
        }
        if (taskQueue.isEmpty()) {
            throw new Error(`No Task in Queue`);
        }
        taskQueue.pop_front();
    }

    printInfo() {
        this.workersMap.forEach((worker, provider) => {
            worker.printInfo();
        });
    }
}
