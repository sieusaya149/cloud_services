import amqp from 'amqplib';
import cluster from 'cluster';
import {queueCloud, exchangeCloud, rabbitMqUri} from '~/config';
export interface shareMessage {
    fileType: string;
    cloudProvider: string;
    data: any;
}
export default class RabbitMqServices {
    static startMasterConsumer = async () => {
        if (!rabbitMqUri) {
            throw new Error('Invalid rabbitmq url');
        }
        const connection = await amqp.connect(rabbitMqUri);
        const channel = await connection.createChannel();
        const queue = await channel.assertQueue(queueCloud);
        channel.bindQueue(queue.queue, exchangeCloud, queueCloud);

        channel.consume(queue.queue, (message) => {
            if (message !== null) {
                const data = JSON.parse(message.content.toString());
                console.log(data);
                // // Determine file type and cloud provider.
                // const fileType = data.fileType;
                // const cloudProvider = data.cloudProvider;

                // Spawn a child process for the specific file type and cloud provider.
                const worker = cluster.fork();
                const msg: shareMessage = {
                    fileType: 'test',
                    cloudProvider: 'google',
                    data: data
                };
                worker.send(msg);

                // Acknowledge the message when processing is complete.
                channel.ack(message);
            }
        });
    };
}
