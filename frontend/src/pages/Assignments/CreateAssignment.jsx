import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../../utils/api';
import { Upload, X, Calendar, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: 'all',
    specificStudents: [],
    maxMarks: 100,
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await assignmentAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelection = (studentId) => {
    setFormData(prev => ({
      ...prev,
      specificStudents: prev.specificStudents.includes(studentId)
        ? prev.specificStudents.filter(id => id !== studentId)
        : [...prev.specificStudents, studentId]
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.assignedTo === 'individual' && formData.specificStudents.length === 0) {
      toast.error('Please select at least one student for individual assignment');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'specificStudents') {
          formData[key].forEach(studentId => {
            submitData.append('specificStudents', studentId);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      files.forEach(file => {
        submitData.append('attachments', file);
      });

      await assignmentAPI.create(submitData);
      toast.success('Assignment created successfully');
      navigate('/assignments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
        <p className="text-gray-600 mt-2">Create a new assignment for your students</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assignment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="input-field"
                placeholder="Enter assignment title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="input-field"
                placeholder="Enter assignment description and instructions"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  required
                  className="pl-10 input-field"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxMarks" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Marks
              </label>
              <input
                type="number"
                id="maxMarks"
                name="maxMarks"
                min="1"
                className="input-field"
                placeholder="100"
                value={formData.maxMarks}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assignment Target</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignedTo"
                    value="all"
                    checked={formData.assignedTo === 'all'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <Users className="h-4 w-4 mr-2" />
                  All Students
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignedTo"
                    value="individual"
                    checked={formData.assignedTo === 'individual'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <Users className="h-4 w-4 mr-2" />
                  Specific Students
                </label>
              </div>
            </div>

            {formData.assignedTo === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {students.map(student => (
                    <label key={student._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specificStudents.includes(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {student.name} ({student.studentId}) - {student.email}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.specificStudents.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.specificStudents.length} student(s) selected
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Attachments</h2>
          
          <div className="space-y-4">
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
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, TXT, JPG, PNG (MAX. 10MB each)
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

            {files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/assignments')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignment;
