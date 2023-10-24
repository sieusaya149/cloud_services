import {CloudConfig, PublishFileData} from 'packunpackservice';
import {randomUUID} from 'crypto';
const MAX_RETRY = 1;

export enum TaskType {
    UPLOAD = 'UPLOAD',
    DELETE = 'DELETE'
}
// format message in queue is
export interface TaskI {
    id: string;
    type: TaskType;
    retryTime: number;
    cloudConfig: CloudConfig;
    createdDate: Date;
}

export class Task implements TaskI {
    public id: string;
    public type: TaskType;
    retryTime: number;
    cloudConfig: CloudConfig;
    createdDate: Date;
    constructor(type: TaskType, CloudConfig: CloudConfig = {} as CloudConfig) {
        this.id = randomUUID();
        this.type = type;
        this.retryTime = 0;
        this.cloudConfig = CloudConfig;
        this.createdDate = new Date();
    }

    public shouldRetry(): boolean {
        if (this.retryTime != MAX_RETRY) {
            this.retryTime += 1;
            return true;
        }
        return false;
    }
}
