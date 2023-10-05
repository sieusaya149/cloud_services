export enum ChildErrorCode {
    E00 = 'Error Null Object',
    E01 = 'Uploading Interupt'
}
export class ChildError extends Error {
    private code: ChildErrorCode;
    private pid: number;
    private reason: string;
    constructor(pid: number, code: ChildErrorCode, message: string) {
        const reason = `WORKER ${pid}:: failure with reason ${code} :: ${message}`;
        super(reason);
        this.pid = pid;
        this.code = code;
        this.reason = reason;
    }
}
