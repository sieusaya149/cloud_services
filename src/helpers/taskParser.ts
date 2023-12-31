import {CloudUploadMsg} from 'packunpackservice';
import {UploadTask} from './Tasks/UploadTask';

export class UploadTaskParser {
    private listTask: UploadTask[];
    constructor() {
        this.listTask = [];
    }

    getTaskFromUnpackedData(unpackData: CloudUploadMsg) {
        const lengthCloudConfig = unpackData.cloudConfigs.length;
        for (let i = 0; i < lengthCloudConfig; i++) {
            const cloudConfig = unpackData.cloudConfigs[i];
            const newUploadTask = new UploadTask(
                cloudConfig,
                unpackData.fileData,
                undefined
            );
            this.listTask.push(newUploadTask);
        }
        return this.listTask;
    }
}
