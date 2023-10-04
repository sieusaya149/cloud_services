import {CloudProvider} from 'packunpackservice';
import {UploadTask} from './workerFtTask';
import AwsService from '../services/aws.services';
import {UploadStrategyBase} from './uploadStrategy';

export class UploadFactory {
    private uploadTask: UploadTask;
    constructor(uploadTask: UploadTask) {
        this.uploadTask = uploadTask;
    }
    createUploadInstance(): UploadStrategyBase | null {
        const provider = this.uploadTask.cloudConfig.type;
        switch (provider) {
            case CloudProvider.AWS:
                return new AwsService(this.uploadTask);
            default:
                return null;
        }
    }
}
