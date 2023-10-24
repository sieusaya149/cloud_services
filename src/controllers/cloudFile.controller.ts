import {WorkerEventEmitter} from '~/events/wokerEvent';
import {UploadStrategyBase} from '../services/uploadServices/uploadStrategy';
import {TaskType} from '~/helpers/workerFtTask';

export class CloudFileController {
    private uploadService: UploadStrategyBase;
    constructor(uploadService: UploadStrategyBase) {
        this.uploadService = uploadService;
    }

    async evaluateTrigger() {
        const currentTask = this.uploadService.getTask();
        if (currentTask.type == TaskType.UPLOAD) {
            await this.triggerUploadFile();
        } else if (currentTask.type == TaskType.DELETE) {
            await this.triggerDeleteFile();
        }
    }

    async triggerUploadFile() {
        const uploadEvent = WorkerEventEmitter.getInstance();
        uploadEvent.setupSuccessUploadEvent();
        uploadEvent.setupFailureUploadEvent();
        uploadEvent.setupProgressUploadEvent();

        try {
            await this.uploadService.executeUpload();
            this.uploadService.triggerSuccessUpload();
        } catch (error) {
            this.uploadService.triggerFailureUpload(`${error}`);
        }
    }

    async triggerDeleteFile() {
        const uploadEvent = WorkerEventEmitter.getInstance();
        uploadEvent.setupSuccessDeleteEvent();
        uploadEvent.setupFailureDeleteEvent();

        try {
            await this.uploadService.executeDelete();
            this.uploadService.triggerSuccessDelete();
        } catch (error) {
            this.uploadService.triggerFailureDelete(`${error}`);
        }
    }
}
