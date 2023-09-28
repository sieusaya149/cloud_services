export const rabbitMqUri = process.env.RABBITMQ_URI || undefined;
export const exchangeCloud =
    process.env.EXCHANGE_CLOUD_PUSH || 'cloud_exchange';
export const queueCloud = process.env.QUEUE_CLOUD || 'cloud_queue';
import {UploadTask} from './helpers/wokerFtTask';
export enum WorkerStatus {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE'
}

export interface WorkerMessage {
    status: WorkerStatus;
    uploadTask: UploadTask;
}
