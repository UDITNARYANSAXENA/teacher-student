
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../utils/api';
import { Plus, Calendar, Users, FileText, Clock, ArrowRight, TrendingUp, Award, Target, Zap } from 'lucide-react';
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
        const totalAssignments = assignmentsResponse.data.assignments.length;
        setStats({
          totalAssignments,
          pendingSubmissions: 0,
          gradedSubmissions: 0,
          overdueAssignments: 0,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: user.role === 'student' ? 'Pending Submissions' : 'Active Assignments',
      value: stats.pendingSubmissions,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: user.role === 'student' ? 'Graded Submissions' : 'Total Students',
      value: stats.gradedSubmissions,
      icon: Award,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Overdue',
      value: stats.overdueAssignments,
      icon: Target,
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user.name}! \ud83d\udc4b
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {user.role === 'student'
              ? 'Track your assignments and submissions'
              : 'Manage your assignments and grade submissions'}
          </p>
        </div>

        {user.role === 'teacher' && (
          <Link
            to="/assignments/create"
            className="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Create Assignment</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 animate-slideUp`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 dark:bg-black/10 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.iconBg} rounded-xl shadow-lg transform transition-transform duration-300 hover:rotate-12`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Assignments */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Recent Assignments
          </h2>
          <Link
            to="/assignments"
            className="group flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-300"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <FileText className="relative h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No assignments found
            </p>
            {user.role === 'teacher' && (
              <Link
                to="/assignments/create"
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>Create your first assignment</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.slice(0, 5).map((assignment, index) => {
              const submission = submissions.find(
                (s) => s.assignment._id === assignment._id
              );
              const overdue = isOverdue(assignment.dueDate);

              return (
                <div
                  key={assignment._id}
                  className="group relative overflow-hidden flex items-center justify-between p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-slideUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                  
                  <div className="relative flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {assignment.title}
                      </h3>
                      {overdue && !submission && (
                        <span className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-medium animate-pulse">
                          Overdue
                        </span>
                      )}
                      {submission && (
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            submission.status === 'graded'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {submission.status === 'graded' ? '\u2713 Graded' : '\u2713 Submitted'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(assignment.dueDate)}
                      </span>
                      {submission && submission.grade !== undefined && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <Award className="h-4 w-4" />
                          Grade: {submission.grade}/{assignment.maxMarks}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/assignments/${assignment._id}`}
                    className="relative flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition-colors duration-300 group/link"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  </Link>
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
