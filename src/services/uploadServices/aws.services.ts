import AWS from 'aws-sdk';
import fs from 'fs';
import stream from 'stream';
import {
    FailureMessage,
    ProgressMessage,
    SuccessMessage
} from '../ipcServices/ipcMessage';
import {UploadTask} from '~/helpers/workerFtTask';
import {UploadStrategyBase} from '~/services/uploadServices/uploadStrategy';

function send(message: string) {
    if (process.send) {
        process.send(message);
    }
}

export default class AwsService extends UploadStrategyBase {
    private s3;
    private bucketName;
    constructor(uploadTask: UploadTask) {
        super(uploadTask);
        const {accessKey, secretKey, bucketName} =
            uploadTask.cloudConfig.metaData;
        this.s3 = new AWS.S3({
            accessKeyId: accessKey,
            secretAccessKey: secretKey
        });
        this.bucketName = bucketName;
    }
    async executeUpload() {
        const readFileStream = fs.createReadStream(
            this.uploadTask.metadata.filePath
        );
        // Create a PassThrough stream to pipe data to S3
        const passThroughStream = new stream.PassThrough();
        const fileParams = {
            Bucket: this.bucketName,
            Key: this.uploadTask.metadata.fileName // The S3 object key
        };
        try {
            await this.s3.headObject(fileParams).promise();
            const falureMessage = new FailureMessage(
                this.uploadTask,
                `file ${this.uploadTask.metadata.fileName} is existed`
            );
            send(falureMessage.toString());
            process.exit(0);
        } catch (error: any) {
            if (error.name === 'NotFound') {
                //continue
                console.log('File Not Found Contiue Upload');
            } else {
                // Handle other errors here....
                const falureMessage = new FailureMessage(
                    this.uploadTask,
                    error
                );
                send(falureMessage.toString());
                process.exit(0);
            }
        }
        // Configure the S3 upload parameters
        const uploadParams = {
            ...fileParams,
            Body: passThroughStream // Use the PassThrough stream as the Body
        };
        // Handle the finish event when the stream processing is complete
        readFileStream.pipe(passThroughStream);

        // Upload the data directly to S3 using the S3 upload method
        const upload = this.s3.upload(uploadParams, (err: any, res: any) => {
            if (err) {
                const falureMessage = new FailureMessage(this.uploadTask);
                send(falureMessage.toString());
                process.exit(1);
            } else {
                const successMessage = new SuccessMessage(this.uploadTask);
                send(successMessage.toString());
                process.exit(0);
            }
        });
        upload.on('httpUploadProgress', (progress: any) => {
            // Calculate the percentage completed
            const percentCompleted =
                (progress.loaded / this.uploadTask.metadata.size) * 100;
            const progressMessage = new ProgressMessage(
                percentCompleted,
                this.uploadTask
            );
            send(progressMessage.toString());
            console.log(`Upload Progress: ${percentCompleted.toFixed(2)}%`);
        });
    }

    async executeUploadMock() {
        console.log('upload task recevied from worker');
        console.log(this.uploadTask);
        const err = false;
        let archo = 0;
        for (let i = 0; i < 1000; i++) {
            const percentCompleted = (i / 1000) * 100;
            if (
                archo != Math.round(percentCompleted) &&
                Math.round(percentCompleted) % 10 == 0
            ) {
                archo = Math.round(percentCompleted);
                const progressMessage = new ProgressMessage(
                    archo,
                    this.uploadTask
                );
                send(progressMessage.toString());
            }
        }
        if (!err) {
            const successMessage = new SuccessMessage(this.uploadTask);
            send(successMessage.toString());
            process.exit(1);
        } else {
            const failureMessage = new FailureMessage(this.uploadTask);
            send(failureMessage.toString());
            process.exit(0);
        }
    }
}
