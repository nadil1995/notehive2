const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    required: true,
    unique: true
  },
  storageLimit: {
    type: Number,
    required: true,
    description: 'Storage limit in bytes'
  },
  maxFileSize: {
    type: Number,
    required: true,
    description: 'Maximum file size in bytes'
  },
  maxRepositories: {
    type: Number,
    required: true,
    description: 'Maximum number of repositories (-1 for unlimited)'
  },
  features: [
    {
      name: String,
      enabled: Boolean
    }
  ],
  monthlyPrice: {
    type: Number,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    default: 0
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Plan', planSchema);
