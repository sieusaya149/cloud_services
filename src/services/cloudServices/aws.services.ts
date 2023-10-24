import {
    HeadObjectCommand,
    S3Client,
    DeleteObjectCommand
} from '@aws-sdk/client-s3';

import {Upload} from '@aws-sdk/lib-storage';

import fs from 'fs';
import stream from 'stream';
import {Task, TaskType} from '~/helpers/Tasks/Task';
import {UploadTask} from '~/helpers/Tasks/UploadTask';
import {DeleteTask} from '~/helpers/Tasks/DeleteTask';

import {CloudServiceStrategyBase} from '~/services/cloudServices/CloudServiceStrategy';
import {ChildError, ChildErrorCode} from '~/errorHandling/childError';
import {getExtFromFile} from '~/utils/utils';

export default class AwsService extends CloudServiceStrategyBase {
    private s3;
    private bucketName;
    constructor(task: Task) {
        super(task);
        const {accessKey, secretKey, bucketName} = task.cloudConfig.metaData;
        this.s3 = new S3Client({
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey
            },
            region: 'ap-southeast-1'
        });
        this.bucketName = bucketName;
    }

    async executeUpload() {
        if (this.task.type != TaskType.UPLOAD) {
            throw new ChildError(
                process.pid,
                ChildErrorCode.E01,
                'This is not a upload task'
            );
        }
        const uploadTask = this.task as UploadTask;
        const fileParams = {
            Bucket: this.bucketName,
            Key: uploadTask.metadata.fileName
        };
        let canUpload = false;
        try {
            let copyVersion = 1;
            while (!canUpload) {
                await this.s3.send(new HeadObjectCommand(fileParams));
                console.warn(
                    `file ${fileParams.Key} is existed on AWS already`
                );
                const {rawFilename, extension} = getExtFromFile(
                    uploadTask.metadata.fileName
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
            uploadTask.metadata.filePath
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

    async executeDelete() {
        if (this.task.type != TaskType.DELETE) {
            throw new ChildError(
                process.pid,
                ChildErrorCode.E01,
                'This is not a upload task'
            );
        }
        const deleteTask = this.task as DeleteTask;

        console.log('***************');
        console.log(deleteTask);

        const deleteCommand = new DeleteObjectCommand({
            Bucket: deleteTask.fileInfor.Bucket,
            Key: deleteTask.fileInfor.Key
        });

        await this.s3.send(deleteCommand);
    }

    async executeUploadMock() {
        console.log('upload task recevied from worker');
        console.log(this.task);
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
            if (this.task.type != TaskType.UPLOAD) {
                throw new ChildError(
                    process.pid,
                    ChildErrorCode.E01,
                    'This is not a upload task'
                );
            }

            const uploadTask = this.task as UploadTask;

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
            const upload = new Upload({
                client: this.s3,
                params: uploadParams
            });

            upload.on('httpUploadProgress', (progress: any) => {
                // Calculate the percentage completed
                const percentCompleted =
                    (progress.loaded / uploadTask.metadata.size) * 100;
                this.triggerProgressUpload(percentCompleted);
            });

            upload
                .done()
                .then((data) => {
                    console.log('File uploaded successfully:', data);
                    uploadTask.setCloudInforWhenSuccess(data);
                    this.triggerSuccessUpload();
                    resolve('Uploading Success' as T);
                })
                .catch((error) => {
                    console.error('Error uploading file:', error);
                    reject(
                        new ChildError(
                            process.pid,
                            ChildErrorCode.E01,
                            `${error}`
                        )
                    );
                });
        });
    };
}
