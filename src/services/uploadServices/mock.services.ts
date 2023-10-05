import {MasterMessage} from '../taskEvent.services';
// import {WorkerMessage, WorkerStatus} from '../config';
import {
    SuccessMessage,
    FailureMessage,
    ProgressMessage
} from '../ipcServices/ipcMessage';
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

        if (!err) {
            const successMessage = new SuccessMessage(uploadTask);
            send(successMessage.toString());
            process.exit(1);
        } else {
            const failureMessage = new FailureMessage(uploadTask);
            send(failureMessage.toString());
            process.exit(0);
        }
    }
}
