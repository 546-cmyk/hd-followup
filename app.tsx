import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

import LoginPage from './pages/Login/LoginPage';
import AboutPage from './pages/About/AboutPage';

import ParentLayout from './components/ParentLayout';
import ParentHomePage from './pages/parent/Home/HomePage';
import ParentRedFlagPage from './pages/parent/RedFlag/RedFlagPage';
import ParentDiaryPage from './pages/parent/Diary/DiaryPage';
import ParentRintalaPage from './pages/parent/Rintala/RintalaPage';
import ParentProfilePage from './pages/parent/Profile/ProfilePage';
import ParentReminderPage from './pages/parent/Reminder/ReminderPage';
import ParentHealthPage from './pages/parent/Health/HealthPage';

import DoctorLayout from './components/DoctorLayout';
import DoctorDashboardPage from './pages/doctor/Dashboard/DashboardPage';
import DoctorPatientsPage from './pages/doctor/Patients/PatientsPage';
import DoctorPatientDetailPage from './pages/doctor/PatientDetail/PatientDetailPage';
import DoctorFollowupPage from './pages/doctor/Followup/FollowupPage';

import NotFound from './pages/NotFound/NotFound';

function RequireAuth({ children, role }: { children: React.ReactNode; role: 'parent' | 'doctor' }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen">加载中...</div>;
  if (!user || user.role !== role) {
    const stored = localStorage.getItem('hd_followup_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === role) return <>{children}</>;
      } catch {
        // ignore
      }
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route path="/parent" element={<RequireAuth role="parent"><ParentLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/parent/home" replace />} />
          <Route path="home" element={<ParentHomePage />} />
          <Route path="red-flag" element={<ParentRedFlagPage />} />
          <Route path="diary" element={<ParentDiaryPage />} />
          <Route path="rintala" element={<ParentRintalaPage />} />
          <Route path="reminder" element={<ParentReminderPage />} />
          <Route path="health" element={<ParentHealthPage />} />
          <Route path="profile" element={<ParentProfilePage />} />
        </Route>

        <Route path="/doctor" element={<RequireAuth role="doctor"><DoctorLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="patients" element={<DoctorPatientsPage />} />
          <Route path="patients/:id" element={<DoctorPatientDetailPage />} />
          <Route path="followup" element={<DoctorFollowupPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
