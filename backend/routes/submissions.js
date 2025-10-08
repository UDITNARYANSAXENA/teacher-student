const express = require('express');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { auth, authorize } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');

const router = express.Router();

// Submit assignment (Students only)
router.post('/', auth, authorize('student'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { assignmentId, content } = req.body;

    // Check if assignment exists and student has access
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student has access to this assignment
    const hasAccess = assignment.assignedTo === 'all' || 
      (assignment.assignedTo === 'individual' && 
       assignment.specificStudents.includes(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this assignment'
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    const submissionData = {
      assignment: assignmentId,
      student: req.user._id,
      content,
      isLate: new Date() > assignment.dueDate
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      submissionData.attachments = req.files.map(file => ({
        filename: file.originalname,
        url: file.path,
        publicId: file.filename
      }));
    }

    const submission = await Submission.create(submissionData);
    await submission.populate('assignment', 'title dueDate maxMarks');
    await submission.populate('student', 'name email studentId');

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get submissions for an assignment (Teachers only)
router.get('/assignment/:assignmentId', auth, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    
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

    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email studentId')
      .populate('assignment', 'title dueDate maxMarks')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get student's submissions
router.get('/my-submissions', auth, authorize('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title dueDate maxMarks createdBy')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Grade submission (Teachers only)
router.put('/:id/grade', auth, authorize('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if teacher owns the assignment
    if (submission.assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate grade
    if (grade > submission.assignment.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed maximum marks (${submission.assignment.maxMarks})`
      });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';

    await submission.save();
    await submission.populate('student', 'name email studentId');

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single submission
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment', 'title dueDate maxMarks createdBy')
      .populate('student', 'name email studentId');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check access rights
    const isStudent = req.user.role === 'student' && submission.student._id.toString() === req.user._id.toString();
    const isTeacher = req.user.role === 'teacher' && submission.assignment.createdBy.toString() === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
