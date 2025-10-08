import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssignmentList from './pages/Assignments/AssignmentList';
import CreateAssignment from './pages/Assignments/CreateAssignment';
import AssignmentDetail from './pages/Assignments/AssignmentDetail';
import SubmissionDetail from './pages/Submissions/SubmissionDetails';
import MySubmissions from './pages/Submissions/MySubmissions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/assignments" element={
              <ProtectedRoute>
                <Layout>
                  <AssignmentList />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/assignments/create" element={
              <ProtectedRoute roles={['teacher']}>
                <Layout>
                  <CreateAssignment />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/assignments/:id" element={
              <ProtectedRoute>
                <Layout>
                  <AssignmentDetail />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/submissions/my" element={
              <ProtectedRoute roles={['student']}>
                <Layout>
                  <MySubmissions />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/submissions/:id" element={
              <ProtectedRoute>
                <Layout>
                  <SubmissionDetail />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
