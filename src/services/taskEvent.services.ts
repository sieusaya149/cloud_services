import EventEmitter from 'events';
import CloudManager from './cloudManager.services';
import {UploadTask} from '../helpers/wokerFtTask';
import cluster from 'cluster';

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
        this.on(TaskEvent.NewTask, (newTask: UploadTask) => {
            const cloudManagerInstance = CloudManager.getInstance();
            const cloudProvider = newTask.cloudProvider;
            if (cloudManagerInstance.isAvaiWorker(cloudProvider)) {
                cloudManagerInstance.startProcessingTask(cloudProvider);
                const worker = cluster.fork();
                const input: MasterMessage = {
                    uploadTask: newTask
                };
                worker.send(input);
            }
        });
    }

    setupSucessTaskEvent() {
        this.on(TaskEvent.SuccessTask, (successTask: UploadTask) => {
            console.log(`SUCCESS TASK ${successTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            cloudManagerInstance.updateSuccessTask(successTask);
        });
    }

    setupFailureTaskEvent() {
        this.on(TaskEvent.FailureTask, (failureTask: UploadTask) => {
            console.log(`FAILED TASK ${failureTask.id}`);
            const cloudManagerInstance = CloudManager.getInstance();
            cloudManagerInstance.updateFailureTask(failureTask);
        });
    }
}
