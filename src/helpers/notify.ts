import {Task} from './Tasks/Task';
import RabbitMqServices from '../services/rabbitmq.services';
import {exchangeNotify, queueNotify} from '~/config';
export enum NotifyType {
    newTask = 'newTask',
    successTask = 'successTask',
    failureTask = 'failureTask'
}
interface NotifyI {
    type: NotifyType;
    task: Task;
    createdAt: Date;
    updatedAt: Date;
}

export class Notify implements NotifyI {
    type: NotifyType;
    task: Task;
    createdAt: Date;
    updatedAt: Date;
    private constructor(notifyType: NotifyType, task: Task) {
        this.type = notifyType;
        this.task = task;
        this.createdAt = this.updatedAt = new Date();
    }

    static getNotifyMsg(notifyType: NotifyType, task: Task): string {
        const notifyMsg = new Notify(notifyType, task);
        return JSON.stringify(notifyMsg);
    }

    static async pushNotify(notifyType: NotifyType, task: Task) {
        console.log(`RABBIT MQ: START Pushing New Notify ${notifyType} to MQ`);
        const notifyMsg = this.getNotifyMsg(notifyType, task);
        await RabbitMqServices.publishMessage(notifyMsg, exchangeNotify);
    }
}
