import {UploadTask} from './workerFtTask';
import RabbitMqServices from '../services/rabbitmq.services';
import {exchangeNotify, queueNotify} from '~/config';
export enum NotifyType {
    newTask = 'newTask',
    successTask = 'successTask',
    failureTask = 'failureTask'
}
interface NotifyI {
    type: NotifyType;
    uploadTask: UploadTask;
    createdAt: Date;
    updatedAt: Date;
}

export class Notify implements NotifyI {
    type: NotifyType;
    uploadTask: UploadTask;
    createdAt: Date;
    updatedAt: Date;
    private constructor(notifyType: NotifyType, uploadTask: UploadTask) {
        this.type = notifyType;
        this.uploadTask = uploadTask;
        this.createdAt = this.updatedAt = new Date();
    }

    static getNotifyMsg(
        notifyType: NotifyType,
        uploadTask: UploadTask
    ): string {
        const notifyMsg = new Notify(notifyType, uploadTask);
        return JSON.stringify(notifyMsg);
    }

    static async pushNotify(notifyType: NotifyType, uploadTask: UploadTask) {
        console.log(`RABBIT MQ: START Pushing New Notify ${notifyType} to MQ`);
        const notifyMsg = this.getNotifyMsg(notifyType, uploadTask);
        await RabbitMqServices.publishMessage(
            notifyMsg,
            exchangeNotify,
            queueNotify
        );
        console.log(`RABBIT MQ: PUBLISHED new Message`);
    }
}
