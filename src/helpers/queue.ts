import {MasterError, MasterErrorCode} from '~/errorHandling/masterError';

interface IQueue<T> {
    push_back(item: T): void;
    pop_front(): T | undefined;
    front(): T | undefined;
    size(): number;
    empty(): void;
}

export default class Queue<T> implements IQueue<T> {
    private storage: T[] = [];

    constructor(private capacity: number = Infinity) {}

    push_back(item: T): void {
        if (this.size() === this.capacity) {
            throw new MasterError(
                process.pid,
                MasterErrorCode.E02,
                `Queue has reached max capacity, you cannot add more items`
            );
        }
        this.storage.push(item);
    }
    pop_front(): T | undefined {
        return this.storage.shift();
    }
    front(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.storage[0];
    }
    size(): number {
        return this.storage.length;
    }
    empty(): void {
        this.storage.splice(0, this.size());
    }

    isEmpty(): boolean {
        return this.size() == 0;
    }
}
