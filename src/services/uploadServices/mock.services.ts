import {MasterCommand} from '../../events/taskingEvent';
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
    uploadingFile(masterMsg: MasterCommand) {
        const {task} = masterMsg;
        // const err = Math.random() <= 0.5;
        const err = false;

        if (!err) {
            const successMessage = new SuccessMessage(task);
            send(successMessage.toString());
            process.exit(1);
        } else {
            const failureMessage = new FailureMessage(task);
            send(failureMessage.toString());
            process.exit(0);
        }
    }
}
