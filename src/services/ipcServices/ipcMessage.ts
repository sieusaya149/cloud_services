// this file help packing and unpacking the data send between the child and the parent proccess

import {randomUUID} from 'crypto';
import {Notify, NotifyType} from '../../helpers/notify';
import CloudManager from '../cloudManager.services';
import {UploadTask, Task, TaskType} from '../../helpers/workerFtTask';
import {TaskEvent} from '../../events/taskingEvent';
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
    task: Task;
}

class IpcMessageBase implements IpcMessageI {
    id: string;
    type: TypeIpcMessage;
    progress: number;
    task: Task;
    reason: any;
    constructor(type: TypeIpcMessage, progress: number, task: Task) {
        this.id = randomUUID();
        this.type = type;
        this.progress = progress;
        this.task = task;
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
    constructor(successTask: Task) {
        super(TypeIpcMessage.SUCCESS, 100, successTask);
    }
    getType(): string | null {
        return TypeIpcMessage.SUCCESS;
    }
    async handlingMessage() {
        CloudManager.getInstance()
            .getEventEmmiter()
            .emit(TaskEvent.SuccessTask, this.task);
        await Notify.pushNotify(NotifyType.successTask, this.task);
    }
}

export class FailureMessage extends IpcMessageBase {
    constructor(failureTask: Task, reason = 'None') {
        super(TypeIpcMessage.FAILURE, 0, failureTask);
        this.reason = reason;
    }
    getType(): string | null {
        return TypeIpcMessage.FAILURE;
    }
    async handlingMessage() {
        CloudManager.getInstance()
            .getEventEmmiter()
            .emit(TaskEvent.FailureTask, this.task);
        await Notify.pushNotify(NotifyType.failureTask, this.task);
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
            this.task as UploadTask,
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
                return new SuccessMessage(this.jsonData.task);
            case TypeIpcMessage.FAILURE:
                return new FailureMessage(this.jsonData.task);
            case TypeIpcMessage.PROGRESS:
                if (this.jsonData.task.type != TaskType.UPLOAD) {
                    console.error('The task is not upload task');
                    return new FailureMessage(this.jsonData.task);
                }
                return new ProgressMessage(
                    this.jsonData.progress,
                    this.jsonData.task as UploadTask
                );
            default:
                return null;
        }
    }
}
