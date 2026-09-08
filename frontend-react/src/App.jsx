import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import DonorManagementPage from './pages/DonorManagementPage';
import VolunteerDashboardPage from './pages/VolunteerDashboardPage';
import ChildDashboardPage from './pages/ChildDashboardPage';

import ChildProfilePage from './pages/ChildProfilePage';
import DonationPage from './pages/DonationPage';
import ExpenseManagementPage from './pages/ExpenseManagementPage';
import VolunteerManagementPage from './pages/VolunteerManagementPage';
import HealthManagementPage from './pages/HealthManagementPage';
import AcademicManagementPage from './pages/AcademicManagementPage';
import AIPredictionPage from './pages/AIPredictionPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import VolunteerLogin from './pages/VolunteerLogin';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteerProfile from './pages/VolunteerProfile';
import AssignedActivities from './pages/AssignedActivities';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes with Navbar & Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Routes (Fullscreen) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/volunteer/login" element={<VolunteerLogin />} />
        <Route path="/volunteer-login" element={<VolunteerLogin />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Dashboard Routes — protected by role */}
        <Route element={<DashboardLayout />}>

          {/* Admin only */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* Staff / Teacher / Doctor / Admin */}
          <Route path="/staff-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'teacher', 'doctor']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          } />

          {/* Donor */}
          <Route path="/donor-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'donor']}>
              <DonorDashboardPage />
            </ProtectedRoute>
          } />

          {/* Volunteer Module Routes */}
          <Route path="/volunteer/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/volunteer-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/volunteer/profile" element={
            <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
              <VolunteerProfile />
            </ProtectedRoute>
          } />
          <Route path="/volunteer/activities" element={
            <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
              <AssignedActivities />
            </ProtectedRoute>
          } />

          {/* Child / Student */}
          <Route path="/child-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'child']}>
              <ChildDashboardPage />
            </ProtectedRoute>
          } />

          {/* Shared routes — restricted by role */}
          <Route path="/child-profile" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'teacher', 'doctor', 'child']}>
              <ChildProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/donation" element={
            <ProtectedRoute allowedRoles={['admin', 'donor']}>
              <DonationPage />
            </ProtectedRoute>
          } />
          <Route path="/expense-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ExpenseManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/donor-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DonorManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/volunteer-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VolunteerManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/health-management" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'teacher', 'doctor', 'child']}>
              <HealthManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/academic-management" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'teacher', 'doctor', 'child']}>
              <AcademicManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/ai-prediction" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'teacher', 'doctor', 'child']}>
              <AIPredictionPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'donor']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
