import EventEmitter from 'events';
import CloudManager from '../services/cloudManager.services';
import {UploadTask, Task} from '../helpers/workerFtTask';
import cluster from 'cluster';
import {Notify, NotifyType} from '../helpers/notify';
import RabbitMqServices from '../services/rabbitmq.services';
import {exchangeNotify, queueNotify} from '~/config';
export enum TaskEvent {
    NewTask = 'NewTask',
    SuccessTask = 'SuccessTask',
    FailureTask = 'FailureTask'
}

export interface MasterCommand {
    task: Task;
}
export class TaskEventEmmitter extends EventEmitter {
    constructor() {
        super();
    }

    setupNewTaskEvent() {
        this.on(TaskEvent.NewTask, async (task: Task) => {
            const cloudManagerInstance = CloudManager.getInstance();
            const cloudConfig = task.cloudConfig;
            const cloudProvider = cloudConfig.type;
            if (cloudManagerInstance.isAvaiWorker(cloudProvider)) {
                cloudManagerInstance.startProcessingTask(cloudProvider);
                // TODO send message queue to notify the new task was executed
                await Notify.pushNotify(NotifyType.newTask, task);
                console.log(
                    'publish notify done forks child to handling new task'
                );
                const worker = cluster.fork();
                const input: MasterCommand = {
                    task: task
                };
                worker.send(input);
            }
        });
    }

    setupSucessTaskEvent() {
        this.on(TaskEvent.SuccessTask, async (successTask: Task) => {
            console.log(`SUCCESS TASK ${successTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            cloudManagerInstance.updateSuccessTask(successTask);
        });
    }

    setupFailureTaskEvent() {
        this.on(TaskEvent.FailureTask, async (failureTask: Task) => {
            console.log(`FAILED TASK ${failureTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            cloudManagerInstance.updateFailureTask(failureTask);
        });
    }
}
