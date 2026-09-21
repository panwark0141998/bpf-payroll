import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { FaceEnrollmentScreen } from './screens/FaceEnrollmentScreen';
import { AttendanceHistoryScreen } from './screens/AttendanceHistoryScreen';

export function App() {
  const [admin, setAdmin] = useState<any | null>(null);
  const [activeScreen, setActiveScreen] = useState<'home' | 'enrollment' | 'history'>('home');

  useEffect(() => {
    const savedAdmin = localStorage.getItem('bpf_mobile_admin') || localStorage.getItem('bpf_mobile_employee');
    const token = localStorage.getItem('bpf_mobile_token');
    if (savedAdmin && token) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        localStorage.removeItem('bpf_mobile_admin');
        localStorage.removeItem('bpf_mobile_employee');
      }
    }

    const handleLogout = () => {
      setAdmin(null);
      setActiveScreen('home');
    };
    window.addEventListener('mobile_auth_logout', handleLogout);
    return () => window.removeEventListener('mobile_auth_logout', handleLogout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bpf_mobile_token');
    localStorage.removeItem('bpf_mobile_admin');
    localStorage.removeItem('bpf_mobile_employee');
    setAdmin(null);
    setActiveScreen('home');
  };

  if (!admin) {
    return <LoginScreen onLoginSuccess={(adm) => setAdmin(adm)} />;
  }

  if (activeScreen === 'enrollment') {
    return (
      <FaceEnrollmentScreen
        onBack={() => setActiveScreen('home')}
        onEnrollmentComplete={() => {
          setActiveScreen('home');
        }}
      />
    );
  }

  if (activeScreen === 'history') {
    return (
      <AttendanceHistoryScreen
        employee={admin}
        onBack={() => setActiveScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      admin={admin}
      onLogout={handleLogout}
      onNavigateToEnrollment={() => setActiveScreen('enrollment')}
      onNavigateToHistory={() => setActiveScreen('history')}
    />
  );
}

export default App;
