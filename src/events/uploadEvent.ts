import EventEmitter from 'events';
import {UploadTask} from '../helpers/workerFtTask';
import {
    FailureMessage,
    ProgressMessage,
    SuccessMessage
} from '~/services/ipcServices/ipcMessage';
export enum UploadEvent {
    PROGRESS_UPLOAD = 'PROGRESS UPLOAD',
    SUCCESS_UPLOAD = 'SUCCESS UPLOAD',
    FAILURE_UPLOAD = 'FAILURE UPLOAD'
}

function sendIpcMessage(message: string) {
    if (process.send) {
        process.send(message);
    }
}

export class UploadEventEmitter extends EventEmitter {
    static instance: UploadEventEmitter;
    private constructor() {
        super();
    }

    static getInstance() {
        if (!UploadEventEmitter.instance) {
            UploadEventEmitter.instance = new UploadEventEmitter();
        }
        return UploadEventEmitter.instance;
    }

    setupProgressUploadEvent() {
        this.on(
            UploadEvent.PROGRESS_UPLOAD,
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
        this.on(UploadEvent.SUCCESS_UPLOAD, async (uploadTask: UploadTask) => {
            const successMessage = new SuccessMessage(uploadTask);
            sendIpcMessage(successMessage.toString());
            process.exit(0);
        });
    }

    setupFailureUploadEvent() {
        this.on(
            UploadEvent.FAILURE_UPLOAD,
            async (uploadTask: UploadTask, message?: string) => {
                const failureMessage = new FailureMessage(uploadTask, message);
                sendIpcMessage(failureMessage.toString());
                process.exit(0);
            }
        );
    }
}
