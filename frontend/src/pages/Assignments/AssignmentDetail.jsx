import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../../utils/api';
import { Calendar, Users, FileText, Download, Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    content: '',
    files: []
  });

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  const fetchAssignmentDetails = async () => {
    try {
      const assignmentResponse = await assignmentAPI.getById(id);
      setAssignment(assignmentResponse.data.assignment);

      if (user.role === 'student') {
        // Check if student has already submitted
        try {
          const submissionsResponse = await submissionAPI.getMySubmissions();
          const existingSubmission = submissionsResponse.data.submissions.find(
            s => s.assignment._id === id
          );
          setSubmission(existingSubmission);
        } catch (error) {
          console.error('Error fetching submissions');
        }
      } else if (user.role === 'teacher') {
        // Fetch all submissions for this assignment
        try {
          const submissionsResponse = await submissionAPI.getByAssignment(id);
          setSubmissions(submissionsResponse.data.submissions);
        } catch (error) {
          console.error('Error fetching submissions');
        }
      }
    } catch (error) {
      toast.error('Failed to fetch assignment details');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSubmissionData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('assignmentId', id);
      formData.append('content', submissionData.content);
      
      submissionData.files.forEach(file => {
        formData.append('attachments', file);
      });

      await submissionAPI.submit(formData);
      toast.success('Assignment submitted successfully');
      fetchAssignmentDetails();
      setShowSubmissionForm(false);
      setSubmissionData({ content: '', files: [] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Assignment not found</h2>
        <Link to="/assignments" className="btn-primary mt-4">
          Back to Assignments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/assignments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600 mt-1">Assignment Details</p>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>Due: {formatDate(assignment.dueDate)}</span>
              {isOverdue(assignment.dueDate) && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Overdue
                </span>
              )}
            </div>
            
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>
                {assignment.assignedTo === 'all' 
                  ? 'All Students' 
                  : `${assignment.specificStudents?.length || 0} Specific Students`
                }
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FileText className="h-5 w-5 mr-2" />
              <span>Maximum Marks: {assignment.maxMarks}</span>
            </div>
          </div>

          {user.role === 'student' && submission && (
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                submission.status === 'graded' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {submission.status === 'graded' ? 'Graded' : 'Submitted'}
              </div>
              {submission.grade !== undefined && (
                <div className="mt-2 text-lg font-bold text-green-600">
                  Grade: {submission.grade}/{assignment.maxMarks}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        </div>

        {/* Assignment Attachments */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
            <div className="space-y-2">
              {assignment.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{attachment.originalName}</span>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`}
                    download
                    className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Submission Section */}
      {user.role === 'student' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submission</h3>
          
          {submission ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Assignment Submitted</p>
                <p className="text-green-600 text-sm mt-1">
                  Submitted on: {formatDate(submission.submittedAt)}
                </p>
              </div>

              {submission.content && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Submission Content:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Submitted Files:</h4>
                  <div className="space-y-2">
                    {submission.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">{attachment.originalName}</span>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`}
                          download
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submission.feedback && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Teacher Feedback:</h4>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {isOverdue(assignment.dueDate) ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Assignment Overdue</p>
                  <p className="text-red-600 text-sm mt-1">
                    This assignment was due on {formatDate(assignment.dueDate)}
                  </p>
                </div>
              ) : (
                <div>
                  {!showSubmissionForm ? (
                    <div className="text-center py-6">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't submitted this assignment yet.</p>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="btn-primary"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAssignment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Submission Content
                        </label>
                        <textarea
                          rows={4}
                          className="input-field"
                          placeholder="Enter your submission content, answers, or notes..."
                          value={submissionData.content}
                          onChange={(e) => setSubmissionData(prev => ({
                            ...prev,
                            content: e.target.value
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Files (Optional)
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      </div>

                      {submissionData.files.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                          <div className="space-y-2">
                            {submissionData.files.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSubmissionForm(false);
                            setSubmissionData({ content: '', files: [] });
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                        >
                          Submit Assignment
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teacher Submissions Section */}
      {user.role === 'teacher' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Student Submissions</h3>
            <span className="text-sm text-gray-600">
              {submissions.length} submission(s)
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {submission.student.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {submission.student.studentId} • {submission.student.email}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted: {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        submission.status === 'graded' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                      </span>
                      {submission.grade !== undefined && (
                        <span className="text-sm font-medium text-green-600">
                          {submission.grade}/{assignment.maxMarks}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/submissions/${submission._id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Submission Details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;
