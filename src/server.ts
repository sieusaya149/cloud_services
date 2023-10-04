import cluster from 'cluster';
import os from 'os';
import RabbitMqServices from './services/rabbitmq.services';
import CloudManager from './services/cloudManager.services';
import {MasterMessage, TaskEvent} from './services/taskEvent.services';
import {autoSendTask} from './simulationPushTask';
import {IpcMessageFactory} from './helpers/ipcMessage';
import {UploadFactory} from './helpers/uploadFactory';
const numCPUs = os.cpus().length;
if (cluster.isPrimary) {
    console.log(`nums cpu is ${numCPUs}`);
    RabbitMqServices.startMasterConsumer();
    const cloudInstance = CloudManager.getInstance();
    const event = cloudInstance.getEventEmmiter();
    event.setupNewTaskEvent();
    event.setupSucessTaskEvent();
    event.setupFailureTaskEvent();
    // setup event Ctrl+C for print the infor before terminate
    process.on('SIGINT', () => {
        cloudInstance.printInfo();
        process.exit(0);
    });
    // setup event for child node
    cluster.on('exit', (worker, code, signal) => {
        console.log(`exit code ${code}`);
        console.log(`XXX==> WORKER ${worker.process.pid} Terminate`);
    });

    cluster.on('message', (worker, message) => {
        console.log(`Worker ${worker.process.pid} send main thread a message`);
        console.log(message);
        const ipcMessageFactory = new IpcMessageFactory(message);
        const parsedMessage = ipcMessageFactory.create();
        if (parsedMessage) {
            console.log(parsedMessage.getType());
            parsedMessage.handlingMessage();
        }
    });
} else {
    // Worker process
    process.on('message', async (masterMsg: MasterMessage) => {
        console.log(
            `=== WORKER ${process.pid} start for handing task id ${masterMsg.uploadTask.id}`
        );
        const uploadTask = masterMsg.uploadTask;
        const uploadFactory = new UploadFactory(uploadTask);
        const uploadService = uploadFactory.createUploadInstance();
        if (!uploadService) {
            throw new Error('Can not create a upload service');
        }
        await uploadService.executeUpload();
    });
}
