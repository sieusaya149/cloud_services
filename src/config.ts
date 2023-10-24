export const rabbitMqUri = process.env.RABBITMQ_URI || undefined;
export const exchangeCloud =
    process.env.EXCHANGE_CLOUD_PUSH || 'cloud_exchange';
export const queueCloud = process.env.QUEUE_CLOUD || 'cloud_queue';

// exchange and queue for handling notify
export const exchangeNotify = process.env.EXCHANGE_NOTIFY || 'notify_exchange';
export const queueNotify = process.env.QUEUE_NOTIFY || 'notify_queue';

// exchange and queue for handling update progress
export const exchangeProgress =
    process.env.EXCHANGE_PROGRESS || 'progress_exchange';
export const queueProgress = process.env.QUEUE_PROGRESS || 'progress_queue';

export const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || '';
export const SECRET_KEY = process.env.SECRET_KEY || '';
export const BUCKET_NAME = process.env.BUCKET_NAME || '';
