const express = require('express');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');

const router = express.Router();

// Create assignment (Teachers only)
router.post('/', auth, authorize('teacher'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo, specificStudents, maxMarks } = req.body;

    const assignmentData = {
      title,
      description,
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.user._id,
      maxMarks: maxMarks || 100
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      assignmentData.attachments = req.files.map(file => ({
        filename: file.originalname,
        url: file.path,
        publicId: file.filename
      }));
    }

    // Handle specific students
    if (assignedTo === 'individual' && specificStudents) {
      const studentIds = Array.isArray(specificStudents) ? specificStudents : [specificStudents];
      assignmentData.specificStudents = studentIds;
    }

    const assignment = await Assignment.create(assignmentData);
    await assignment.populate('createdBy', 'name email');
    await assignment.populate('specificStudents', 'name email studentId');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      // Students can only see assignments assigned to them
      query = {
        $or: [
          { assignedTo: 'all' },
          { 
            assignedTo: 'individual',
            specificStudents: req.user._id
          }
        ]
      };
    } else if (req.user.role === 'teacher') {
      // Teachers can see assignments they created
      query = { createdBy: req.user._id };
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'name email')
      .populate('specificStudents', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('specificStudents', 'name email studentId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student has access to this assignment
    if (req.user.role === 'student') {
      const hasAccess = assignment.assignedTo === 'all' || 
        (assignment.assignedTo === 'individual' && 
         assignment.specificStudents.some(student => student._id.toString() === req.user._id.toString()));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all students (for teachers to assign individual assignments)
router.get('/students/list', auth, authorize('teacher'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email studentId');
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update assignment (Teachers only)
router.put('/:id', auth, authorize('teacher'), upload.array('attachments', 5), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, description, dueDate, assignedTo, specificStudents, maxMarks } = req.body;

    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (assignedTo) assignment.assignedTo = assignedTo;
    if (maxMarks) assignment.maxMarks = maxMarks;

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        url: file.path,
        publicId: file.filename
      }));
      assignment.attachments = [...assignment.attachments, ...newAttachments];
    }

    // Handle specific students
    if (assignedTo === 'individual' && specificStudents) {
      const studentIds = Array.isArray(specificStudents) ? specificStudents : [specificStudents];
      assignment.specificStudents = studentIds;
    } else if (assignedTo === 'all') {
      assignment.specificStudents = [];
    }

    await assignment.save();
    await assignment.populate('createdBy', 'name email');
    await assignment.populate('specificStudents', 'name email studentId');

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete assignment (Teachers only)
router.delete('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete attachments from Cloudinary
    if (assignment.attachments && assignment.attachments.length > 0) {
      for (const attachment of assignment.attachments) {
        if (attachment.publicId) {
          await cloudinary.uploader.destroy(attachment.publicId);
        }
      }
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
