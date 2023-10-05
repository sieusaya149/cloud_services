// this file help packing and unpacking the data send between the child and the parent proccess

import {randomUUID} from 'crypto';
import {Notify, NotifyType} from '../../helpers/notify';
import CloudManager from '../cloudManager.services';
import {UploadTask} from '../../helpers/workerFtTask';
import {TaskEvent} from '../taskEvent.services';
import {Progress} from '../../helpers/progress';
import {WebSocketServer} from '../../socket-handler/webSockerServer';

enum TypeIpcMessage {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    PROGRESS = 'PROGRESS'
}

interface IpcMessageI {
    id: string;
    type: TypeIpcMessage;
    uploadTask: UploadTask;
}

class IpcMessageBase implements IpcMessageI {
    id: string;
    type: TypeIpcMessage;
    progress: number;
    uploadTask: UploadTask;
    reason: any;
    constructor(
        type: TypeIpcMessage,
        progress: number,
        uploadTask: UploadTask
    ) {
        this.id = randomUUID();
        this.type = type;
        this.progress = progress;
        this.uploadTask = uploadTask;
        this.reason = '';
    }
    getType(): string | null {
        console.error('Do not to be called');
        return null;
    }

    async handlingMessage() {
        console.error('Do not to be called');
    }

    toString(): string {
        return JSON.stringify(this);
    }

    static toJson(stringMessage: string): IpcMessageBase {
        const ipcJson: IpcMessageBase = JSON.parse(stringMessage);
        if (ipcJson.type == null) {
            console.error(ipcJson);
            throw new Error('Can Not Unpack Message From Child Process');
        }
        return ipcJson;
    }
}

export class SuccessMessage extends IpcMessageBase {
    constructor(successUploadTask: UploadTask) {
        super(TypeIpcMessage.SUCCESS, 100, successUploadTask);
    }
    getType(): string | null {
        return TypeIpcMessage.SUCCESS;
    }
    async handlingMessage() {
        CloudManager.getInstance()
            .getEventEmmiter()
            .emit(TaskEvent.SuccessTask, this.uploadTask);
        await Notify.pushNotify(NotifyType.successTask, this.uploadTask);
    }
}

export class FailureMessage extends IpcMessageBase {
    constructor(FailureUploadTask: UploadTask, reason = 'None') {
        super(TypeIpcMessage.FAILURE, 0, FailureUploadTask);
        this.reason = reason;
    }
    getType(): string | null {
        return TypeIpcMessage.FAILURE;
    }
    async handlingMessage() {
        CloudManager.getInstance()
            .getEventEmmiter()
            .emit(TaskEvent.FailureTask, this.uploadTask);
        await Notify.pushNotify(NotifyType.failureTask, this.uploadTask);
    }
}

export class ProgressMessage extends IpcMessageBase {
    constructor(progress: number, uploadingTask: UploadTask) {
        super(TypeIpcMessage.PROGRESS, progress, uploadingTask);
    }
    getType(): string | null {
        return TypeIpcMessage.PROGRESS;
    }
    // Due to the rate limit of rabbit mq, need to switch to web socket
    async handlingMessage() {
        // await Progress.pushProgress(this);
        WebSocketServer.getInstance().updateProgressForUser(
            this.uploadTask,
            this.progress
        );
    }
}

export class IpcMessageFactory {
    private jsonData: IpcMessageBase;
    constructor(stringData: string) {
        this.jsonData = IpcMessageBase.toJson(stringData);
    }
    create(): IpcMessageBase | null {
        switch (this.jsonData.type) {
            case TypeIpcMessage.SUCCESS:
                return new SuccessMessage(this.jsonData.uploadTask);
            case TypeIpcMessage.FAILURE:
                return new FailureMessage(this.jsonData.uploadTask);
            case TypeIpcMessage.PROGRESS:
                return new ProgressMessage(
                    this.jsonData.progress,
                    this.jsonData.uploadTask
                );
            default:
                return null;
        }
    }
}
