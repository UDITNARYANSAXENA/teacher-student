import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionAPI } from '../../utils/api';
import { FileText, Calendar, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await submissionAPI.getMySubmissions();
      setSubmissions(response.data.submissions);
    } catch (error) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status === filter;
  });

  const getGradeColor = (grade, maxMarks) => {
    const percentage = (grade / maxMarks) * 100;
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your assignment submissions and grades
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: submissions.length },
          { key: 'submitted', label: 'Pending', count: submissions.filter(s => s.status === 'submitted').length },
          { key: 'graded', label: 'Graded', count: submissions.filter(s => s.status === 'graded').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? "You haven't submitted any assignments yet"
              : `No ${filter} submissions found`
            }
          </p>
          <Link
            to="/assignments"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 transition"
          >
            View Assignments
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map(submission => (
            <div
              key={submission._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {submission.assignment.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        submission.status === 'graded'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {submission.status === 'graded' ? 'Graded' : 'Pending Review'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted: {formatDate(submission.submittedAt)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Due: {formatDate(submission.assignment.dueDate)}
                    </div>
                    {submission.grade !== undefined && (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1 text-yellow-500" />
                        <span className={`font-medium ${getGradeColor(submission.grade, submission.assignment.maxMarks)}`}>
                          Grade: {submission.grade}/{submission.assignment.maxMarks}
                        </span>
                      </div>
                    )}
                  </div>

                  {submission.feedback && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                      <strong>Feedback:</strong> {submission.feedback}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Link
                    to={`/submissions/${submission._id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
