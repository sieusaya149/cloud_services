import {CloudProvider} from 'packunpackservice';
import {UploadTask} from './workerFtTask';

export class UploadStrategyBase {
    protected uploadTask: UploadTask;
    constructor(uploadTask: UploadTask) {
        this.uploadTask = uploadTask;
    }
    async executeUpload() {}
}
