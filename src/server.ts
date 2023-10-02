import cluster from 'cluster';
import os from 'os';
import RabbitMqServices, {shareMessage} from './services/rabbitmq.services';
import MockService from './services/mock.services';
import CloudManager from './services/cloudManager.services';
import {MasterMessage, TaskEvent} from './services/taskEvent.services';
import {WorkerStatus, WorkerMessage} from './config';
import {autoSendTask} from './simulationPushTask';
const numCPUs = os.cpus().length;
if (cluster.isPrimary) {
    console.log(`nums cpu is ${numCPUs}`);
    // RabbitMqServices.startMasterConsumer();
    autoSendTask();
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
        console.log(`XXX==> WORKER ${worker.process.pid} Terminate`);
    });

    cluster.on('message', (worker, message) => {
        console.log(`Worker ${worker.process.pid} send main thread a message`);
        const jsonMessage: WorkerMessage = JSON.parse(message);
        switch (jsonMessage.status) {
            case WorkerStatus.SUCCESS:
                cloudInstance
                    .getEventEmmiter()
                    .emit(TaskEvent.SuccessTask, jsonMessage.uploadTask);
                break;
            case WorkerStatus.FAILURE:
                cloudInstance
                    .getEventEmmiter()
                    .emit(TaskEvent.FailureTask, jsonMessage.uploadTask);
                break;

            default:
                throw new Error('No Worker Message Matched');
                break;
        }
    });
} else {
    // Worker process
    process.on('message', (masterMsg: MasterMessage) => {
        console.log(
            `=== WORKER ${process.pid} start for handing task id ${masterMsg.uploadTask.id}`
        );
        const mockService = new MockService();
        mockService.uploadingFile(masterMsg);
    });
}
