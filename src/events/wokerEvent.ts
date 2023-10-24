import EventEmitter from 'events';
import {DeleteTask, UploadTask} from '../helpers/workerFtTask';
import {
    FailureMessage,
    ProgressMessage,
    SuccessMessage
} from '~/services/ipcServices/ipcMessage';
export enum WorkerEvent {
    PROGRESS_UPLOAD = 'PROGRESS UPLOAD',
    SUCCESS_UPLOAD = 'SUCCESS UPLOAD',
    FAILURE_UPLOAD = 'FAILURE UPLOAD',
    SUCCESS_DELETE = 'SUCCESS_DELETE',
    FAILURE_DELETE = 'FAILURE_DELETE'
}

function sendIpcMessage(message: string) {
    if (process.send) {
        process.send(message);
    }
}

export class WorkerEventEmitter extends EventEmitter {
    static instance: WorkerEventEmitter;
    private constructor() {
        super();
    }

    static getInstance() {
        if (!WorkerEventEmitter.instance) {
            WorkerEventEmitter.instance = new WorkerEventEmitter();
        }
        return WorkerEventEmitter.instance;
    }

    setupProgressUploadEvent() {
        this.on(
            WorkerEvent.PROGRESS_UPLOAD,
            async (percentCompleted: number, uploadTask: UploadTask) => {
                const progressMessage = new ProgressMessage(
                    percentCompleted,
                    uploadTask
                );
                console.log(`Upload Progress: ${percentCompleted.toFixed(2)}%`);
                sendIpcMessage(progressMessage.toString());
            }
        );
    }

    setupSuccessUploadEvent() {
        this.on(WorkerEvent.SUCCESS_UPLOAD, async (uploadTask: UploadTask) => {
            const successMessage = new SuccessMessage(uploadTask);
            sendIpcMessage(successMessage.toString());
            process.exit(0);
        });
    }

    setupFailureUploadEvent() {
        this.on(
            WorkerEvent.FAILURE_UPLOAD,
            async (uploadTask: UploadTask, message?: string) => {
                const failureMessage = new FailureMessage(uploadTask, message);
                sendIpcMessage(failureMessage.toString());
                process.exit(0);
            }
        );
    }

    setupSuccessDeleteEvent() {
        this.on(WorkerEvent.SUCCESS_DELETE, async (deleteTask: DeleteTask) => {
            const successMessage = new SuccessMessage(deleteTask);
            sendIpcMessage(successMessage.toString());
            process.exit(0);
        });
    }

    setupFailureDeleteEvent() {
        this.on(WorkerEvent.FAILURE_DELETE, async (deleteTask: DeleteTask) => {
            const successMessage = new FailureMessage(deleteTask);
            sendIpcMessage(successMessage.toString());
            process.exit(0);
        });
    }
}
