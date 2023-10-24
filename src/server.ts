import cluster from 'cluster';
import os from 'os';
import RabbitMqServices from './services/rabbitmq.services';
import CloudManager from './services/cloudManager.services';
import {MasterCommand} from './events/taskingEvent';
import {autoSendTask} from './simulationPushTask';
import {IpcMessageFactory} from './services/ipcServices/ipcMessage';
import {CloudServiceFactory} from './services/cloudServices/CloudServiceFactory';
import express, {Express} from 'express';
import {createServer} from 'http';
import {WebSocketServer} from './socket-handler/webSockerServer';
import {ChildErrorCode, ChildError} from './errorHandling/childError';
import {CloudFileController} from './controllers/cloudFile.controller';
import {TaskType} from './helpers/Tasks/Task';
import {UploadTask} from './helpers/Tasks/UploadTask';
import {DeleteTask} from './helpers/Tasks/DeleteTask';

const numCPUs = os.cpus().length;
if (cluster.isPrimary) {
    console.log(`nums cpu is ${numCPUs}`);
    RabbitMqServices.consumerMessage();
    // autoSendTask();
    const cloudInstance = CloudManager.getInstance();
    const event = cloudInstance.getEventEmmiter();
    // setup event for master node
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
    // setup socket server
    const app: Express = express();
    const httpServer = createServer(app);
    WebSocketServer.getInstance(httpServer);
    httpServer.listen(3005);
} else {
    // Worker process
    process.on('message', async (masterCommand: MasterCommand) => {
        console.log(
            `**** WORKER ${process.pid} start for handing task id ${masterCommand.task.id}`
        );
        const task = masterCommand.task;
        const taskType = task.type;
        if (taskType == TaskType.UPLOAD || taskType == TaskType.DELETE) {
            const copiedTask =
                taskType == TaskType.UPLOAD
                    ? new UploadTask(undefined, undefined, task as UploadTask)
                    : new DeleteTask(undefined, undefined, task as DeleteTask);
            const cloudServiceFactory = new CloudServiceFactory(copiedTask);
            const uploadService = cloudServiceFactory.createCloudService();
            if (!uploadService) {
                throw new ChildError(
                    process.pid,
                    ChildErrorCode.E00,
                    'Can Not Create Upload Service Instance'
                );
            }
            const cloudFileController = new CloudFileController(uploadService);
            await cloudFileController.evaluateTrigger();
        } else {
            console.error(masterCommand);
            throw new ChildError(
                process.pid,
                ChildErrorCode.E00,
                'Can Not Process MasterCommand'
            );
        }
    });
}
