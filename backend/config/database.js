const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('MongoDB Connected', {
      metadata: { host: conn.connection.host }
    });
    return conn;
  } catch (error) {
    logger.error('MongoDB Connection Error', {
      metadata: { error: error.message }
    });
    process.exit(1);
  }
};

module.exports = connectDB;
