import {MasterMessage} from './taskEvent.services';
import {WorkerMessage, WorkerStatus} from '../config';

function send(message: string) {
    if (process.send) {
        process.send(message);
    }
}

export default class MockService {
    constructor() {}
    uploadingFile(masterMsg: MasterMessage) {
        const {uploadTask} = masterMsg;
        // const err = Math.random() <= 0.5;
        const err = false;

        if (err) {
            const workerMessage: WorkerMessage = {
                status: WorkerStatus.FAILURE,
                uploadTask: uploadTask
            };
            const message: string = JSON.stringify(workerMessage) || '';
            send(message);
            process.exit(1);
        } else {
            console.error(err);
            const workerMessage: WorkerMessage = {
                status: WorkerStatus.SUCCESS,
                uploadTask: uploadTask
            };
            const message: string = JSON.stringify(workerMessage) || '';
            send(message);
            process.exit(0);
        }
    }
}
