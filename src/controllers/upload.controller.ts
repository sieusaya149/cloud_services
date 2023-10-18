import {UploadEventEmitter} from '~/events/uploadEvent';
import {UploadStrategyBase} from '../services/uploadServices/uploadStrategy';

export class UploadController {
    private uploadService: UploadStrategyBase;
    constructor(uploadService: UploadStrategyBase) {
        this.uploadService = uploadService;
    }

    async triggerUploadFile() {
        const uploadEvent = UploadEventEmitter.getInstance();
        uploadEvent.setupSuccessUploadEvent();
        uploadEvent.setupFailureUploadEvent();
        uploadEvent.setupProgressUploadEvent();

        try {
            await this.uploadService.executeUpload();
            this.uploadService.triggerSuccessUpload();
        } catch (error) {
            this.uploadService.triggerFailureUpload(`${error}`);
        }
    }
}
