const MAX_TASK_FOR_EACH_PROVIDER = 1;
const MAX_RETRY = 1;
import {randomUUID} from 'crypto';
import {CloudConfig, PublishFileData} from 'packunpackservice';

// format message in queue is
export interface UploadTaskI {
    id: string;
    cloudConfig: CloudConfig;
    metadata: PublishFileData;
    createdDate: Date;
    retryTime: number;
}

export class UploadTask implements UploadTaskI {
    id: string;
    cloudConfig: CloudConfig;
    metadata: PublishFileData;
    createdDate: Date;
    retryTime: number;
    constructor(cloudConfig: CloudConfig, metaData: PublishFileData) {
        this.id = randomUUID();
        this.cloudConfig = cloudConfig;
        this.metadata = metaData;
        this.createdDate = new Date();
        this.retryTime = 0;
    }

    public shouldRetry(): boolean {
        if (this.retryTime != MAX_RETRY) {
            this.retryTime += 1;
            return true;
        }
        return false;
    }
}

export interface WorkerInfoI {
    provider: string;
    running: number;
    totalTask: number;
    successTask: number;
    failureTask: number;
}

export class WorkerInfo implements WorkerInfoI {
    provider: string;
    running: number;
    totalTask: number;
    successTask: number;
    failureTask: number;
    constructor(providerInfor: string) {
        this.provider = providerInfor;
        this.running = 0;
        this.totalTask = 0;
        this.successTask = 0;
        this.failureTask = 0;
    }

    isAvai() {
        if (this.running < MAX_TASK_FOR_EACH_PROVIDER) {
            return true;
        }
        return false;
    }

    private increaseSuccess() {
        this.successTask += 1;
    }

    private increaseFailure() {
        this.failureTask += 1;
    }

    private increaseTotal() {
        this.totalTask += 1;
    }

    // this function valid when all job done
    public isValidInfo(): boolean {
        console.log(
            `The total tasks is ${this.totalTask} differ with sum of success ${this.successTask} and failure ${this.failureTask}`
        );
        return this.totalTask == this.successTask + this.failureTask;
    }

    private increaseRunning() {
        if (this.running == MAX_TASK_FOR_EACH_PROVIDER) {
            throw new Error(`Reach Max Worker for ${this.provider}`);
        }
        this.running += 1;
    }

    private decreaseRunning() {
        if (this.running == 0) {
            throw new Error(`Reach Min Worker for ${this.provider}`);
        }
        this.running -= 1;
    }

    private doneTask() {
        this.decreaseRunning();
        if (!this.isValidInfo()) {
            throw new Error(
                `The total tasks is ${this.totalTask} differ with sum of success ${this.successTask} and failure ${this.failureTask}`
            );
        }
    }

    public startNewTask() {
        this.increaseRunning();
        this.increaseTotal();
    }
    public successUpdate() {
        console.log(`Worker ${this.provider} success`);
        this.increaseSuccess();
        this.doneTask();
    }

    public failureUpdate() {
        console.log(`Worker ${this.provider} failure`);
        this.increaseFailure();
        this.doneTask();
    }

    public printInfo() {
        console.log(`\n INFOR AFTER ALL PROVIDER WORKER FOR ${this.provider}
                        Total task processing: ${this.totalTask}
                        Success task processing: ${this.successTask}
                        Failure task processing: ${this.failureTask} \n`);
    }
}
