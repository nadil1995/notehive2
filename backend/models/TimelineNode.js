const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  fileType: {
    type: String,
    enum: ['pdf', 'word', 'excel', 'image', 'audio', 'video', 'other'],
    default: 'other'
  },
  fileSize: Number,
  s3Key: String,
  fileUrl: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const timelineNodeSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  tags: [String],
  attachments: [attachmentSchema],
  color: {
    type: String,
    default: '#FFFFFF'
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

// Index for timeline queries
timelineNodeSchema.index({ repositoryId: 1, date: -1 });
timelineNodeSchema.index({ repositoryId: 1, createdAt: -1 });
timelineNodeSchema.index({ tags: 1 });

module.exports = mongoose.model('TimelineNode', timelineNodeSchema);
