const winston = require('winston');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Custom S3 Transport for Winston
class S3Transport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.bucketName = opts.bucketName;
    this.s3 = opts.s3;
    this.logs = [];
    this.flushInterval = opts.flushInterval || 60000; // Flush every 60 seconds
    this.startFlushing();
  }

  log(info, callback) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level: info.level,
      message: info.message,
      metadata: info.metadata || {}
    });

    if (callback) {
      callback();
    }
  }

  startFlushing() {
    setInterval(() => {
      if (this.logs.length > 0) {
        this.flushToS3();
      }
    }, this.flushInterval);
  }

  flushToS3() {
    const logContent = this.logs
      .map(log => JSON.stringify(log))
      .join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `logs/app-logs-${timestamp}-${uuidv4()}.log`;

    const params = {
      Bucket: this.bucketName,
      Key: filename,
      Body: logContent,
      ContentType: 'application/json'
    };

    this.s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading logs to S3:', err);
      } else {
        console.log(`Logs uploaded to S3: ${data.Location}`);
        this.logs = [];
      }
    });
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'notehive-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new S3Transport({
      bucketName: process.env.AWS_BUCKET_NAME,
      s3: s3,
      flushInterval: 60000
    })
  ]
});

module.exports = logger;
