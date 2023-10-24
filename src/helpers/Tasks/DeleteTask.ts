import {CloudConfig} from 'packunpackservice';
import {Task, TaskType} from './Task';
export interface DeleteTaskI {
    fileInfor: any;
}

export class DeleteTask extends Task implements DeleteTaskI {
    fileInfor: any;
    public constructor(
        cloudConfig?: CloudConfig,
        fileInfor?: any,
        deleteTask?: DeleteTask
    ) {
        super(TaskType.DELETE);
        if (deleteTask) {
            this.id = deleteTask.id;
            this.cloudConfig = deleteTask.cloudConfig;
            this.retryTime = deleteTask.retryTime;
            this.fileInfor = deleteTask.fileInfor;
            this.createdDate = deleteTask.createdDate;
        } else if (cloudConfig && fileInfor) {
            this.cloudConfig = cloudConfig;
            this.fileInfor = fileInfor;
        } else {
            throw new Error('Can not create Delete Task');
        }
    }
}
