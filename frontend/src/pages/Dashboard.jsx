import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../utils/api';
import { Plus, Calendar, Users, FileText, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0,
    overdueAssignments: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const assignmentsResponse = await assignmentAPI.getAll();
      setAssignments(assignmentsResponse.data.assignments);

      if (user.role === 'student') {
        const submissionsResponse = await submissionAPI.getMySubmissions();
        setSubmissions(submissionsResponse.data.submissions);

        // Calculate student stats
        const totalAssignments = assignmentsResponse.data.assignments.length;
        const submittedCount = submissionsResponse.data.submissions.length;
        const gradedCount = submissionsResponse.data.submissions.filter(
          (s) => s.status === 'graded'
        ).length;
        const overdue = assignmentsResponse.data.assignments.filter(
          (a) =>
            new Date(a.dueDate) < new Date() &&
            !submissionsResponse.data.submissions.find(
              (s) => s.assignment._id === a._id
            )
        ).length;

        setStats({
          totalAssignments,
          pendingSubmissions: totalAssignments - submittedCount,
          gradedSubmissions: gradedCount,
          overdueAssignments: overdue,
        });
      } else {
        // Teacher stats
        const totalAssignments = assignmentsResponse.data.assignments.length;
        setStats({
          totalAssignments,
          pendingSubmissions: 0,
          gradedSubmissions: 0,
          overdueAssignments: 0,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #b91c1c',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user.role === 'student'
              ? 'Track your assignments and submissions'
              : 'Manage your assignments and grade submissions'}
          </p>
        </div>

        {user.role === 'teacher' && (
          <Link
            to="/assignments/create"
            className="flex items-center space-x-2 rounded-md bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 font-medium hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Assignment</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Assignments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalAssignments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {user.role === 'student' ? 'Pending Submissions' : 'Active Assignments'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.pendingSubmissions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {user.role === 'student' ? 'Graded Submissions' : 'Total Students'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.gradedSubmissions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.overdueAssignments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Recent Assignments
          </h2>
          <Link
            to="/assignments"
            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No assignments found
            </p>
            {user.role === 'teacher' && (
              <Link
                to="/assignments/create"
                className="mt-4 inline-flex items-center space-x-2 rounded-md bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 font-medium hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create your first assignment</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.slice(0, 5).map((assignment) => {
              const submission = submissions.find(
                (s) => s.assignment._id === assignment._id
              );
              const overdue = isOverdue(assignment.dueDate);

              return (
                <div
                  key={assignment._id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {assignment.title}
                      </h3>
                      {overdue && !submission && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                          Overdue
                        </span>
                      )}
                      {submission && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            submission.status === 'graded'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Due: {formatDate(assignment.dueDate)}
                    </p>
                    {submission && submission.grade !== undefined && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Grade: {submission.grade}/{assignment.maxMarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/assignments/${assignment._id}`}
                      className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;