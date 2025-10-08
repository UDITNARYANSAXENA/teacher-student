const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  attachments: [{
    filename: String,
    url: String,
    publicId: String
  }],
  assignedTo: {
    type: String,
    enum: ['all', 'individual'],
    default: 'all'
  },
  specificStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100,
    min: [1, 'Maximum marks must be at least 1']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
