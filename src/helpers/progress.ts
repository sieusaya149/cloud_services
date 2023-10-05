import {ProgressMessage} from '../services/ipcServices/ipcMessage';
import {UploadTask} from './workerFtTask';
import RabbitMqServices from '../services/rabbitmq.services';
import {exchangeProgress, queueProgress} from '~/config';

interface ProgressI {
    taskId: string;
    uploadTask: UploadTask;
    percentage: number;
    updatedAt: Date;
}

export class Progress implements ProgressI {
    taskId: string;
    uploadTask: UploadTask;
    percentage: number;
    updatedAt: Date;
    private constructor(progressMessage: ProgressMessage) {
        this.taskId = progressMessage.id;
        this.uploadTask = progressMessage.uploadTask;
        this.percentage = progressMessage.progress;
        this.updatedAt = new Date();
    }

    // FIXME there is a rate limit when pusing many message in the same time to rabbitmq
    static async pushProgress(progressMessage: ProgressMessage) {
        const newProgress = new Progress(progressMessage);
        await RabbitMqServices.publishMessage(
            JSON.stringify(newProgress),
            exchangeProgress,
            queueProgress
        );
    }
}
