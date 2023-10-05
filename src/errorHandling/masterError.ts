export enum MasterErrorCode {
    E00 = 'Error Null Object',
    E01 = 'Worker Busy',
    E02 = 'Invalid information'
}
export class MasterError extends Error {
    private code: MasterErrorCode;
    private pid: number;
    private reason: string;
    constructor(pid: number, code: MasterErrorCode, message: string) {
        const reason = `MASTER ${pid}:: failure with reason ${code} :: ${message}`;
        super(reason);
        this.pid = pid;
        this.code = code;
        this.reason = reason;
    }
}
