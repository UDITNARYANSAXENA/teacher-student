import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submissionAPI } from '../../utils/api';
import { ArrowLeft, FileText, Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await submissionAPI.getById(id);
      setSubmission(response.data.submission);

      if (response.data.submission.grade !== undefined) {
        setGradeData({
          grade: response.data.submission.grade,
          feedback: response.data.submission.feedback || ''
        });
      }
    } catch (error) {
      toast.error('Failed to fetch submission details');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    const gradeValue = parseFloat(gradeData.grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > submission.assignment.maxMarks) {
      toast.error(`Grade must be between 0 and ${submission.assignment.maxMarks}`);
      return;
    }

    try {
      setGrading(true);
      await submissionAPI.grade(id, gradeData);
      toast.success('Submission graded successfully');
      fetchSubmissionDetails();
    } catch (error) {
      toast.error('Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submission not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Submission Details</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{submission.assignment.title}</p>
        </div>
      </div>

      {/* Submission Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user.role === 'teacher' ? submission.student.name : 'Your Submission'}
            </h3>
            {user.role === 'teacher' && (
              <p className="text-gray-600 dark:text-gray-400">
                {submission.student.studentId} • {submission.student.email}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Submitted: {formatDate(submission.submittedAt)}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                submission.status === 'graded'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {submission.status === 'graded' ? 'Graded' : 'Pending Review'}
            </span>

            {submission.grade !== undefined && (
              <div className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                Grade: {submission.grade}/{submission.assignment.maxMarks}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Assignment: <span className="font-medium">{submission.assignment.title}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Due Date: <span className="font-medium">{formatDate(submission.assignment.dueDate)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Maximum Marks: <span className="font-medium">{submission.assignment.maxMarks}</span>
          </p>
        </div>

        {/* Submission Content */}
        {submission.content && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Submission Content</h4>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{submission.content}</p>
            </div>
          </div>
        )}

        {/* Submission Attachments */}
        {submission.attachments?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Submitted Files</h4>
            <div className="space-y-2">
              {submission.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{attachment.originalName}</span>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${attachment.filename}`}
                    download
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {submission.feedback && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Teacher Feedback</h4>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-blue-800 dark:text-blue-300">{submission.feedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grading Form (Teacher Only) */}
      {user.role === 'teacher' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {submission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
          </h3>

          <form onSubmit={handleGradeSubmission} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade (0-{submission.assignment.maxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={submission.assignment.maxMarks}
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition"
                  value={gradeData.grade}
                  onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition"
                placeholder="Provide feedback to the student..."
                value={gradeData.feedback}
                onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={grading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 transition"
              >
                <Save className="h-4 w-4" />
                <span>{grading ? 'Saving...' : 'Save Grade'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetail;
