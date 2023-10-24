import {CloudProvider} from 'packunpackservice';
import {Task} from '../../helpers/workerFtTask';
import AwsService from './aws.services';
import {UploadStrategyBase} from './uploadStrategy';

export class CloudServiceFactory {
    private task: Task;
    constructor(task: Task) {
        this.task = task;
    }
    createCloudService(): UploadStrategyBase | null {
        const provider = this.task.cloudConfig.type;
        switch (provider) {
            case CloudProvider.AWS:
                return new AwsService(this.task);
            default:
                return null;
        }
    }
}
