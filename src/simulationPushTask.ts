import {CloudProvider} from './helpers/workerFtTask';
import CloudManager from './services/cloudManager.services';

interface taskData {
    content: string;
}
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

const INTERVAL_TIME = 1000;
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
        const cloudProvider = randomProvider();
        const fakeData: taskData = {
            content: `Fake Task Infor for ${cloudProvider}`
        };
        CloudManager.getInstance().addNewTask(cloudProvider, fakeData);
    }, INTERVAL_TIME);
};
