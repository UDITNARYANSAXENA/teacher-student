
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../../utils/api';
import { Calendar, Users, FileText, Download, Upload, ArrowLeft, ArrowRight ,Sparkles, CheckCircle, Clock, Award, AlertCircle , User} from 'lucide-react';
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
      toast.success('Assignment submitted successfully! \ud83c\udf89');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Assignment not found</h2>
        <Link to="/assignments" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 animate-slideInLeft">
        <button
          onClick={() => navigate('/assignments')}
          className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 transform hover:scale-110 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {assignment.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assignment Details
          </p>
        </div>
      </div>

      {/* Assignment Info Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50 transform transition-all duration-500 hover:shadow-2xl animate-slideUp">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Due Date</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(assignment.dueDate)}</p>
              </div>
              {isOverdue(assignment.dueDate) && (
                <span className="ml-auto px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-medium animate-pulse">
                  Overdue
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Assigned To</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {assignment.assignedTo === 'all' 
                    ? 'All Students' 
                    : `${assignment.specificStudents?.length || 0} Specific Students`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Maximum Marks</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{assignment.maxMarks}</p>
              </div>
            </div>
          </div>

          {user.role === 'student' && submission && (
            <div className="lg:text-right animate-scaleIn">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${
                submission.status === 'graded' 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}>
                {submission.status === 'graded' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Graded
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Submitted
                  </>
                )}
              </div>
              {submission.grade !== undefined && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Your Grade</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {submission.grade}/{assignment.maxMarks}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Description
          </h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
          </div>
        </div>

        {/* Assignment Attachments */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Attachments
            </h3>
            <div className="space-y-3">
              {assignment.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center flex-1">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.originalName}</span>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <Download className="h-4 w-4" />
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
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50 animate-slideUp" style={{ animationDelay: '100ms' }}>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Your Submission
          </h3>
          
          {submission ? (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="text-green-800 dark:text-green-300 font-bold text-lg">Assignment Submitted</p>
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Submitted on: {formatDate(submission.submittedAt)}
                </p>
              </div>

              {submission.content && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Submission Content:
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Submitted Files:
                  </h4>
                  <div className="space-y-2">
                    {submission.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.originalName}</span>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`}
                          download
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submission.feedback && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Teacher Feedback:
                  </h4>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-blue-800 dark:text-blue-300">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {isOverdue(assignment.dueDate) ? (
                <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <p className="text-red-800 dark:text-red-300 font-bold text-lg mb-2">Assignment Overdue</p>
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    This assignment was due on {formatDate(assignment.dueDate)}
                  </p>
                </div>
              ) : (
                <div>
                  {!showSubmissionForm ? (
                    <div className="text-center py-8">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <Upload className="relative h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">You haven't submitted this assignment yet.</p>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Upload className="h-5 w-5" />
                        Submit Assignment
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAssignment} className="space-y-6 animate-slideDown">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Submission Content
                        </label>
                        <textarea
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm resize-none"
                          placeholder="Enter your submission content, answers, or notes..."
                          value={submissionData.content}
                          onChange={(e) => setSubmissionData(prev => ({
                            ...prev,
                            content: e.target.value
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Upload Files (Optional)
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
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
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Selected Files:</h4>
                          <div className="space-y-2">
                            {submissionData.files.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center">
                                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors duration-300"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSubmissionForm(false);
                            setSubmissionData({ content: '', files: [] });
                          }}
                          className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
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
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50 animate-slideUp" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Student Submissions
            </h3>
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-300 rounded-xl text-sm font-semibold border border-blue-200 dark:border-blue-800">
              {submissions.length} submission(s)
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <FileText className="relative h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div key={submission._id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] animate-slideUp" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {submission.student.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {submission.student.studentId} \u2022 {submission.student.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Submitted: {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                        submission.status === 'graded' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                          : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {submission.status === 'graded' ? '\u2713 Graded' : 'Pending'}
                      </span>
                      {submission.grade !== undefined && (
                        <span className="px-3 py-1.5 text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
                          {submission.grade}/{assignment.maxMarks}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/submissions/${submission._id}`}
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold text-sm transition-colors duration-300 group"
                  >
                    <span>View Submission Details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
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
