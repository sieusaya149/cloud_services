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
import {ChildError, ChildErrorCode} from '~/errorHandling/childError';
import {getExtFromFile} from '~/utils/utils';

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
        const fileParams = {
            Bucket: this.bucketName,
            Key: this.uploadTask.metadata.fileName
        };
        let canUpload = false;
        try {
            let copyVersion = 1;
            while (!canUpload) {
                await this.s3.headObject(fileParams).promise();
                console.warn(
                    `file ${fileParams.Key} is existed on AWS already`
                );
                const {rawFilename, extension} = getExtFromFile(
                    this.uploadTask.metadata.fileName
                );
                fileParams.Key =
                    rawFilename + `(${copyVersion})` + `.${extension}`;
                console.warn(`rename file to ${fileParams.Key}`);
                copyVersion = copyVersion + 1;
            }
        } catch (error: any) {
            if (error.name === 'NotFound') {
                canUpload = true;
                //continue
                console.log('File Not Found Continue Upload');
            } else {
                console.log(error);
                throw new ChildError(
                    process.pid,
                    ChildErrorCode.E01,
                    'Can Not Connecting to S3 Service'
                );
            }
        }
        const readFileStream = fs.createReadStream(
            this.uploadTask.metadata.filePath
        );
        const passThroughStream = new stream.PassThrough();

        const listStream = [readFileStream, passThroughStream];
        await this.awaitUploadStream(
            readFileStream,
            passThroughStream,
            fileParams,
            listStream
        );
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
                this.triggerProgressUpload(archo);
            }
        }
        if (!err) {
            this.triggerFailureUpload();
        } else {
            this.triggerSuccessUpload();
        }
    }

    private awaitUploadStream = <T>(
        inputSteam: any,
        outputStream: any,
        fileParams: any,
        allStreamsToCatchError: any[]
    ) => {
        return new Promise<T>((resolve, reject) => {
            allStreamsToCatchError.forEach((currentStream: any) => {
                currentStream.on('error', (e: Error) => {
                    reject(
                        new ChildError(
                            process.pid,
                            ChildErrorCode.E01,
                            'Stream Dead'
                        )
                    );
                });
            });

            inputSteam.pipe(outputStream).on('finish', (data: T) => {});

            // Configure the S3 upload parameters
            const uploadParams = {
                ...fileParams,
                Body: outputStream
            };

            // Upload the data directly to S3 using the S3 upload method
            const upload = this.s3.upload(
                uploadParams,
                (err: any, res: any) => {
                    if (err) {
                        reject(
                            new ChildError(
                                process.pid,
                                ChildErrorCode.E01,
                                `${err}`
                            )
                        );
                    } else {
                        console.log(res);
                        this.uploadTask.setCloudInforWhenSuccess(res);
                        this.triggerSuccessUpload();
                        resolve('Uploading Success' as T);
                    }
                }
            );
            upload.on('httpUploadProgress', (progress: any) => {
                // Calculate the percentage completed
                const percentCompleted =
                    (progress.loaded / this.uploadTask.metadata.size) * 100;
                this.triggerProgressUpload(percentCompleted);
            });
        });
    };
}
