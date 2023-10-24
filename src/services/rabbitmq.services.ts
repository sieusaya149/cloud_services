import amqp from 'amqplib';
import {queueCloud, exchangeCloud, rabbitMqUri} from '../config';
import {DeleteTask} from '../helpers/Tasks/DeleteTask';
import CloudManager from './cloudManager.services';
import {UnpackingFactory, PackUnPackType} from 'packunpackservice';
import {UploadTaskParser} from '~/helpers/taskParser';
export interface shareMessage {
    fileType: string;
    cloudProvider: string;
    data: any;
}
export default class RabbitMqServices {
    static consumerMessage = async () => {
        if (!rabbitMqUri) {
            throw new Error('Invalid rabbitmq url');
        }
        const connection = await amqp.connect(rabbitMqUri);
        const channel = await connection.createChannel();
        const queue = await channel.assertQueue(queueCloud);
        channel.bindQueue(queue.queue, exchangeCloud, queueCloud);

        channel.consume(queue.queue, (message) => {
            if (message !== null) {
                // FIXME currently I have a redundant task that related to parse the data to json
                const data = JSON.parse(message.content.toString());
                const unpackingFactory = new UnpackingFactory(data.typeMsg);
                const unpackingInstance =
                    unpackingFactory.createUnpackingInstance();
                if (!unpackingInstance) {
                    throw new Error('Can not create unpacking instance');
                }
                const unpackedData = unpackingInstance.unpack(
                    message.content.toString()
                );
                console.log(`==> The new task is ${data.typeMsg}`);
                if (data.typeMsg == PackUnPackType.CLOUD_UPLOAD) {
                    const uploadTaskParser = new UploadTaskParser();
                    const listUploadTask =
                        uploadTaskParser.getTaskFromUnpackedData(unpackedData);
                    for (
                        let index = 0;
                        index < listUploadTask.length;
                        index++
                    ) {
                        CloudManager.getInstance().addNewTask(
                            listUploadTask[index]
                        );
                    }
                } else if (data.typeMsg == PackUnPackType.DELETE_CLOUD_FILE) {
                    const {cloudConfig, fileInfor} = unpackedData.fileData;
                    const deleteTask = new DeleteTask(cloudConfig, fileInfor);
                    CloudManager.getInstance().addNewTask(deleteTask);
                }
                // Acknowledge the message when processing is complete.
                channel.ack(message);
            }
        });
    };

    static publishMessage = async (
        message: string,
        exchangeName: string,
        routingKey: string = '',
        typeExchange = 'fanout'
    ) => {
        // Create a RabbitMQ connection within the scope of this function.
        if (!rabbitMqUri) {
            throw new Error('Please give info connection rabbitmq');
        }
        const connection = await amqp.connect(rabbitMqUri);

        try {
            // Create a channel for this connection.
            const channel = await connection.createChannel();
            // Declare the exchange (you can also declare queues here).
            // Make sure the exchange and queue definitions match your RabbitMQ setup.
            console.log(
                `assert exchange ${exchangeName} with type is ${typeExchange}`
            );
            await channel.assertExchange(exchangeName, typeExchange, {
                durable: true
            });

            // Publish the message to the exchange.
            console.log(
                `publish message to exchange ${exchangeName} with routing key is ${routingKey}`
            );
            channel.publish(exchangeName, routingKey, Buffer.from(message));

            // Close the channel.
            await channel.close();
        } catch (error) {
            console.error('Error publishing message:', error);
        } finally {
            // Close the connection when you're done.
            await connection.close();
        }
    };
}
