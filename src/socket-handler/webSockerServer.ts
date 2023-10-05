import {Server, Socket} from 'socket.io';
import {UploadTask} from '../helpers/workerFtTask';
import {CloudProvider} from 'packunpackservice';

const WEBSOCKET_CORS = {
    origin: '*',
    methods: ['GET', 'POST']
};
type Connections = {
    [id: string]: Socket;
};

type ProgressSocketMsg = {
    fileId: string;
    provider: CloudProvider;
    percentage: number;
    speed: string;
};
export class WebSocketServer extends Server {
    private static io: WebSocketServer;
    private connections: Connections;
    constructor(httpServer: any) {
        super(httpServer, {
            cors: WEBSOCKET_CORS
        });
        this.connections = {};
    }

    public static getInstance(httpServer?: any): WebSocketServer {
        if (!WebSocketServer.io) {
            WebSocketServer.io = new WebSocketServer(httpServer);
            WebSocketServer.io.setupOnConnect();
        }
        return WebSocketServer.io;
    }

    private setupOnConnect() {
        WebSocketServer.io.on('connection', (socket) => {
            const userId = socket.handshake.query.userId;
            if (typeof userId !== 'string') {
                throw new Error('userId is not string');
            }
            this.connections[userId] = socket;
            console.log('the new connection to the server ', userId);
            socket.on('disconnect', () => {
                delete this.connections[userId];
            });
        });
    }

    public updateProgressForUser(uploadTask: UploadTask, percentage: number) {
        const toUser = uploadTask.metadata.owner.toString();

        if (this.connections[toUser]) {
            const progressMsg: ProgressSocketMsg = {
                fileId: uploadTask.metadata.fileId.toString(),
                provider: uploadTask.cloudConfig.type,
                percentage: percentage,
                speed: '1kb/s'
            };
            console.log('===== SOCKET MESSAGE UPLOADING PROGRESS =====');
            console.log(progressMsg);
            this.connections[toUser].emit(
                'UploadingProgress',
                JSON.stringify(progressMsg)
            );
        }
    }
}
