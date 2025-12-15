
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { StudentDataProvider } from './context/StudentDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminPortal from './views/AdminPortal';
import TeacherPortal from './views/TeacherPortal';
import ParentPortal from './views/ParentPortal';
import LoginView from './views/LoginView';
import LandingView from './views/LandingView';
import SettingsView from './views/SettingsView';
import StudentProfileView from './views/StudentProfileView';
import StudentListView from './views/StudentListView';
import SignupView from './views/SignupView';

const AuthenticatedApp: React.FC = () => {
  const { user, loading, login } = useAuth();
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'SETTINGS' | 'STUDENTS'>('DASHBOARD');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  
  // Auth Flow State
  const [authStep, setAuthStep] = useState<'LANDING' | 'LOGIN' | 'SIGNUP'>('LANDING');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Magic Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const magicToken = params.get('magic_token');
    const magicEmail = params.get('email');

    if (magicToken && magicEmail) {
        // Clear params to clean URL
        window.history.replaceState({}, document.title, "/");
        // Simulate verify and login
        login(magicEmail).then(success => {
            if (!success) {
                alert("Invalid or expired magic link.");
            }
        });
    }
  }, [login]);

  const handleDevLogin = async (role: UserRole) => {
    let email = '';
    switch(role) {
      case UserRole.ADMIN: email = 'sysadmin@school.com'; break;
      case UserRole.PRINCIPAL: email = 'admin@school.com'; break;
      case UserRole.TEACHER: email = 'teacher@school.com'; break;
      case UserRole.PARENT: email = 'parent@school.com'; break;
    }
    if(email) {
       await login(email);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand-blue font-bold">Loading...</div>;
  }

  // Not Authenticated Flow
  if (!user) {
    if (authStep === 'SIGNUP') {
      return <SignupView onBack={() => setAuthStep('LANDING')} />;
    }

    if (authStep === 'LOGIN' && selectedRole) {
      return (
        <LoginView 
          role={selectedRole} 
          onBack={() => setAuthStep('LANDING')} 
        />
      );
    }
    return (
      <LandingView 
        onLoginSelect={(role) => { 
          setSelectedRole(role); 
          setAuthStep('LOGIN'); 
        }}
        onSignupSelect={() => setAuthStep('SIGNUP')} 
        onDevLogin={handleDevLogin}
      />
    );
  }

  const handleNavigate = (view: 'DASHBOARD' | 'SETTINGS' | 'STUDENTS', studentId?: string) => {
    setCurrentView(view);
    if (studentId) {
      setCurrentStudentId(studentId);
    } else if (view === 'STUDENTS') {
      setCurrentStudentId(null); // Reset to list view if explicitly navigating to Students tab
    }
  };

  const handleStudentSelect = (id: string) => {
    setCurrentStudentId(id);
  };

  const handleBackToStudentList = () => {
    setCurrentStudentId(null);
  };

  // Authenticated Portal Routing
  const renderPortal = () => {
    // Shared Students View Logic
    if (currentView === 'STUDENTS') {
      if (currentStudentId) {
        return <StudentProfileView studentId={currentStudentId} onBack={handleBackToStudentList} />;
      }
      return <StudentListView onSelectStudent={handleStudentSelect} />;
    }

    // Role-based Dashboards
    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.PRINCIPAL:
        return <AdminPortal />;
      case UserRole.TEACHER:
        return <TeacherPortal />;
      case UserRole.PARENT:
        return <ParentPortal />;
      default:
        return <AdminPortal />;
    }
  };

  return (
    <Layout role={user.role} currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'SETTINGS' ? <SettingsView /> : renderPortal()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StudentDataProvider>
        <AuthenticatedApp />
      </StudentDataProvider>
    </AuthProvider>
  );
};

export default App;
