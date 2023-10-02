import EventEmitter from 'events';
import CloudManager from './cloudManager.services';
import {UploadTask} from '../helpers/workerFtTask';
import cluster from 'cluster';
import {Notify, NotifyType} from '../helpers/notify';
import RabbitMqServices from './rabbitmq.services';
import {exchangeNotify, queueNotify} from '~/config';
export enum TaskEvent {
    NewTask = 'NewTask',
    SuccessTask = 'SuccessTask',
    FailureTask = 'FailureTask'
}

export interface MasterMessage {
    uploadTask: UploadTask;
}
export class TaskEventEmmitter extends EventEmitter {
    constructor() {
        super();
    }

    setupNewTaskEvent() {
        this.on(TaskEvent.NewTask, async (newTask: UploadTask) => {
            const cloudManagerInstance = CloudManager.getInstance();
            const cloudProvider = newTask.cloudProvider;
            if (cloudManagerInstance.isAvaiWorker(cloudProvider)) {
                cloudManagerInstance.startProcessingTask(cloudProvider);
                // TODO send message queue to notify the new task was executed
                await Notify.pushNotify(NotifyType.newTask, newTask);
                console.log('publish notify done');
                const worker = cluster.fork();
                const input: MasterMessage = {
                    uploadTask: newTask
                };
                worker.send(input);
            }
        });
    }

    setupSucessTaskEvent() {
        this.on(TaskEvent.SuccessTask, async (successTask: UploadTask) => {
            console.log(`SUCCESS TASK ${successTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            // TODO send message queue to notify the new task was executed
            await Notify.pushNotify(NotifyType.successTask, successTask);
            cloudManagerInstance.updateSuccessTask(successTask);
        });
    }

    setupFailureTaskEvent() {
        this.on(TaskEvent.FailureTask, async (failureTask: UploadTask) => {
            console.log(`FAILED TASK ${failureTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            // TODO send message queue to notify the new task was executed
            await Notify.pushNotify(NotifyType.failureTask, failureTask);
            cloudManagerInstance.updateFailureTask(failureTask);
        });
    }
}
