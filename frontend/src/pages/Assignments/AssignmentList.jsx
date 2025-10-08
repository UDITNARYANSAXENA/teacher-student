import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, submissionAPI } from '../../utils/api';
import { Plus, Calendar, Users, FileText, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const AssignmentList = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAssignments();
    if (user.role === 'student') {
      fetchSubmissions();
    }
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getAll();
      setAssignments(response.data.assignments);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await submissionAPI.getMySubmissions();
      setSubmissions(response.data.submissions);
    } catch (error) {
      console.error('Failed to fetch submissions');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentAPI.delete(id);
        setAssignments(assignments.filter(a => a._id !== id));
        toast.success('Assignment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete assignment');
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getAssignmentStatus = (assignment) => {
    if (user.role === 'teacher') return 'active';
    
    const submission = submissions.find(s => s.assignment._id === assignment._id);
    if (submission) {
      return submission.status === 'graded' ? 'graded' : 'submitted';
    }
    return isOverdue(assignment.dueDate) ? 'overdue' : 'pending';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    
    const status = getAssignmentStatus(assignment);
    return status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'student' 
              ? 'View and submit your assignments' 
              : 'Manage your assignments and track submissions'
            }
          </p>
        </div>
        
        {user.role === 'teacher' && (
          <Link
            to="/assignments/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Assignment</span>
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search assignments..."
            className="pl-10 input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            className="pl-10 input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            {user.role === 'student' ? (
              <>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </>
            ) : (
              <option value="active">Active</option>
            )}
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : user.role === 'teacher' 
                ? 'Create your first assignment to get started'
                : 'No assignments have been assigned to you yet'
            }
          </p>
          {user.role === 'teacher' && !searchTerm && filterStatus === 'all' && (
            <Link
              to="/assignments/create"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assignment</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const submission = submissions.find(s => s.assignment._id === assignment._id);
            const status = getAssignmentStatus(assignment);
            const overdue = isOverdue(assignment.dueDate);

            return (
              <div key={assignment._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {status === 'overdue' && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Overdue
                      </span>
                    )}
                    {status === 'submitted' && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Submitted
                      </span>
                    )}
                    {status === 'graded' && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Graded
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {assignment.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {assignment.assignedTo === 'all' 
                        ? 'All Students' 
                        : `${assignment.specificStudents?.length || 0} Students`
                      }
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Max Marks: {assignment.maxMarks}</span>
                  </div>

                  {submission && submission.grade !== undefined && (
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <span>Grade: {submission.grade}/{assignment.maxMarks}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Link
                    to={`/assignments/${assignment._id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View Details
                  </Link>
                  
                  {user.role === 'teacher' && (
                    <div className="flex space-x-2">
                      <Link
                        to={`/assignments/${assignment._id}/edit`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
