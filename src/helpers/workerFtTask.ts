const MAX_TASK_FOR_EACH_PROVIDER = 1;
const MAX_RETRY = 1;
import {randomUUID} from 'crypto';
import {CloudConfig, PublishFileData} from 'packunpackservice';

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

export interface UploadTaskI {
    metadata: PublishFileData;
}

export interface DeleteTaskI {
    fileInfor: any;
}

type CloudUploadInfo = {
    ETag: string;
    ServerSideEncryption: string;
    Location: string;
    Key: string;
    Bucket: string;
};

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

export class UploadTask extends Task implements UploadTaskI {
    metadata: PublishFileData;
    cloudUploadInfo: CloudUploadInfo = {} as CloudUploadInfo;

    public constructor(
        cloudConfig?: CloudConfig,
        metaData?: PublishFileData,
        uploadTask?: UploadTask
    ) {
        super(TaskType.UPLOAD);
        if (uploadTask) {
            this.id = uploadTask.id;
            this.cloudConfig = uploadTask.cloudConfig;
            this.retryTime = uploadTask.retryTime;
            this.metadata = uploadTask.metadata;
            this.createdDate = uploadTask.createdDate;
            this.cloudUploadInfo = uploadTask.cloudUploadInfo;
        } else if (cloudConfig && metaData) {
            this.cloudConfig = cloudConfig;
            this.metadata = metaData;
        } else {
            throw new Error('Can not create upload Task');
        }
    }

    public setCloudInforWhenSuccess(resultUpload: any) {
        console.log('reset cloudUploadInfor');
        this.cloudUploadInfo.ETag = resultUpload.ETag || 'Etag not provided';
        this.cloudUploadInfo.ServerSideEncryption =
            resultUpload.ServerSideEncryption ||
            'ServerSideEncryption not provided';
        this.cloudUploadInfo.Location =
            resultUpload.Location || 'Location not provided';
        this.cloudUploadInfo.Key = resultUpload.Key || 'Key not provided';
        this.cloudUploadInfo.Bucket =
            resultUpload.Bucket || 'Bucket not provided';
    }
}

export class DeleteTask extends Task implements DeleteTaskI {
    fileInfor: any;
    public constructor(
        cloudConfig?: CloudConfig,
        fileInfor?: any,
        deleteTask?: DeleteTask
    ) {
        super(TaskType.DELETE);
        if (deleteTask) {
            this.id = deleteTask.id;
            this.cloudConfig = deleteTask.cloudConfig;
            this.retryTime = deleteTask.retryTime;
            this.fileInfor = deleteTask.fileInfor;
            this.createdDate = deleteTask.createdDate;
        } else if (cloudConfig && fileInfor) {
            this.cloudConfig = cloudConfig;
            this.fileInfor = fileInfor;
        } else {
            throw new Error('Can not create Delete Task');
        }
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
