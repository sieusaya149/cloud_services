import {CloudConfig, PublishFileData} from 'packunpackservice';
import {Task, TaskType} from './Task';

type CloudUploadInfo = {
    ETag: string;
    ServerSideEncryption: string;
    Location: string;
    Key: string;
    Bucket: string;
};

export interface UploadTaskI {
    metadata: PublishFileData;
}

export class UploadTask extends Task implements UploadTaskI {
    metadata: PublishFileData;
    cloudUploadInfo: CloudUploadInfo = {} as CloudUploadInfo;

    public constructor(
        cloudConfig?: CloudConfig,
        metaData?: PublishFileData,
        uploadTask?: UploadTask
    ) {
        super(TaskType.UPLOAD);
        if (uploadTask) {
            this.id = uploadTask.id;
            this.cloudConfig = uploadTask.cloudConfig;
            this.retryTime = uploadTask.retryTime;
            this.metadata = uploadTask.metadata;
            this.createdDate = uploadTask.createdDate;
            this.cloudUploadInfo = uploadTask.cloudUploadInfo;
        } else if (cloudConfig && metaData) {
            this.cloudConfig = cloudConfig;
            this.metadata = metaData;
        } else {
            throw new Error('Can not create upload Task');
        }
    }

    public setCloudInforWhenSuccess(resultUpload: any) {
        console.log('reset cloudUploadInfor');
        this.cloudUploadInfo.ETag = resultUpload.ETag || 'Etag not provided';
        this.cloudUploadInfo.ServerSideEncryption =
            resultUpload.ServerSideEncryption ||
            'ServerSideEncryption not provided';
        this.cloudUploadInfo.Location =
            resultUpload.Location || 'Location not provided';
        this.cloudUploadInfo.Key = resultUpload.Key || 'Key not provided';
        this.cloudUploadInfo.Bucket =
            resultUpload.Bucket || 'Bucket not provided';
    }
}
