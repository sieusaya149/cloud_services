import {CloudProvider} from 'packunpackservice';
import {UploadTask} from '../../helpers/workerFtTask';
import {UploadEvent, UploadEventEmitter} from '~/events/uploadEvent';

export class UploadStrategyBase {
    protected uploadTask: UploadTask;
    protected uploadEvent: UploadEventEmitter;

    constructor(uploadTask: UploadTask) {
        this.uploadEvent = UploadEventEmitter.getInstance();
        this.uploadTask = uploadTask;
    }
    async executeUpload() {}
    async executeUploadMock() {}

    public triggerSuccessUpload() {
        this.uploadEvent.emit(UploadEvent.SUCCESS_UPLOAD, this.uploadTask);
    }
    public triggerFailureUpload(message?: string) {
        this.uploadEvent.emit(
            UploadEvent.FAILURE_UPLOAD,
            this.uploadTask,
            message
        );
    }
    protected triggerProgressUpload(percentCompleted: number) {
        this.uploadEvent.emit(
            UploadEvent.PROGRESS_UPLOAD,
            percentCompleted,
            this.uploadTask
        );
    }
}
