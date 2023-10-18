import {CloudConfig, CloudProvider, PublishFileData} from 'packunpackservice';
import {UploadTask} from './helpers/workerFtTask';
import CloudManager from './services/cloudManager.services';
import {Types} from 'mongoose';
let numtaskIndex = 0; // this help monitor the nums of task was sent
let intervalId: string | number | NodeJS.Timeout | undefined;
function randomProvider() {
    const randumNum = Math.round(Math.random() * 10);
    const remain = randumNum % 3;
    if (remain == 0) {
        return CloudProvider.AWS;
    } else if (remain == 1) {
        return CloudProvider.GOOGLE;
    } else {
        return CloudProvider.AZURE;
    }
}

const INTERVAL_TIME = 2000;
const MAX_TASK = 20;
export const autoSendTask = () => {
    intervalId = setInterval(() => {
        console.log(`INTERVAL_SEND: ====> SEND TASK ${numtaskIndex}`);
        numtaskIndex++;
        if (numtaskIndex === MAX_TASK) {
            // Clear the interval when numtaskIndex reaches MAX
            clearInterval(intervalId);
            console.log('============== STOP SEND TASK =================');
        }
        // const cloudProvider = randomProvider();
        const cloudProvider = CloudProvider.AWS;

        const fakeCloudConfig: CloudConfig = {
            type: cloudProvider,
            owner: new Types.ObjectId(),
            metaData: {
                accessKey: 'fakeKey1',
                secretKey: 'fakeKey2',
                bucketName: 'fakeBucketName'
            }
        };

        const fakeFileData: PublishFileData = {
            fileId: new Types.ObjectId(),
            owner: new Types.ObjectId(),
            fileName: 'fakeFileName',
            filePath: 'fakeFilePath',
            size: 1000
        };
        const uploadTaskFake: UploadTask = new UploadTask(
            undefined,
            fakeCloudConfig,
            fakeFileData
        );
        CloudManager.getInstance().addNewTask(uploadTaskFake);
    }, INTERVAL_TIME);
};
