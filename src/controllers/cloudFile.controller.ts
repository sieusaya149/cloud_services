import {WorkerEventEmitter} from '~/events/wokerEvent';
import {CloudServiceStrategyBase} from '../services/cloudServices/CloudServiceStrategy';
import {TaskType} from '../helpers/Tasks/Task';

export class CloudFileController {
    private cloudService: CloudServiceStrategyBase;
    constructor(cloudService: CloudServiceStrategyBase) {
        this.cloudService = cloudService;
    }

    async evaluateTrigger() {
        const currentTask = this.cloudService.getTask();
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
            await this.cloudService.executeUpload();
            this.cloudService.triggerSuccessUpload();
        } catch (error) {
            this.cloudService.triggerFailureUpload(`${error}`);
        }
    }

    async triggerDeleteFile() {
        const uploadEvent = WorkerEventEmitter.getInstance();
        uploadEvent.setupSuccessDeleteEvent();
        uploadEvent.setupFailureDeleteEvent();

        try {
            await this.cloudService.executeDelete();
            this.cloudService.triggerSuccessDelete();
        } catch (error) {
            this.cloudService.triggerFailureDelete(`${error}`);
        }
    }
}
