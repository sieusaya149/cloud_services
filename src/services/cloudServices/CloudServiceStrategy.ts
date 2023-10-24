import {Task} from '../../helpers/Tasks/Task';
import {WorkerEvent, WorkerEventEmitter} from '~/events/wokerEvent';

export class CloudServiceStrategyBase {
    protected task: Task;
    protected taskEvent: WorkerEventEmitter;

    constructor(task: Task) {
        this.taskEvent = WorkerEventEmitter.getInstance();
        this.task = task;
    }
    async executeUpload() {}
    async executeDelete() {}
    async executeUploadMock() {}

    public triggerSuccessUpload() {
        this.taskEvent.emit(WorkerEvent.SUCCESS_UPLOAD, this.task);
    }

    public getTask(): Task {
        return this.task;
    }

    public triggerFailureUpload(message?: string) {
        this.taskEvent.emit(WorkerEvent.FAILURE_UPLOAD, this.task, message);
    }
    protected triggerProgressUpload(percentCompleted: number) {
        this.taskEvent.emit(
            WorkerEvent.PROGRESS_UPLOAD,
            percentCompleted,
            this.task
        );
    }
    public triggerSuccessDelete() {
        this.taskEvent.emit(WorkerEvent.SUCCESS_DELETE, this.task);
    }

    public triggerFailureDelete(message?: string) {
        this.taskEvent.emit(WorkerEvent.FAILURE_DELETE, this.task, message);
    }
}
