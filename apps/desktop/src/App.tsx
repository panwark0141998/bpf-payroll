import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { AttendanceRegister } from './pages/AttendanceRegister';

export function App() {
  const [user, setUser] = useState<any | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  useEffect(() => {
    // Check existing stored user session
    const savedUser = localStorage.getItem('bpf_user');
    const token = localStorage.getItem('bpf_access_token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('bpf_user');
      }
    }

    const handleAuthLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth_logout', handleAuthLogout);
    return () => window.removeEventListener('auth_logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    if (user?.companyId) {
      api.get(`/companies/${user.companyId}/units`)
        .then((res) => {
          setUnits(res.data.data);
        })
        .catch((err) => {
          console.error('Failed to load company units', err);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('bpf_access_token');
      localStorage.removeItem('bpf_user');
      setUser(null);
    }
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header
          user={user}
          units={units}
          selectedUnitId={selectedUnitId}
          onSelectUnit={(uId) => setSelectedUnitId(uId)}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {currentRoute === 'dashboard' && (
            <Dashboard
              user={user}
              selectedUnitId={selectedUnitId}
              onNavigate={(route) => setCurrentRoute(route)}
            />
          )}

          {currentRoute === 'employees' && (
            <Employees
              user={user}
              selectedUnitId={selectedUnitId}
            />
          )}

          {currentRoute === 'attendance' && (
            <AttendanceRegister
              user={user}
              selectedUnitId={selectedUnitId}
            />
          )}

          {currentRoute !== 'dashboard' && currentRoute !== 'employees' && currentRoute !== 'attendance' && (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '48px 24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', textTransform: 'capitalize' }}>
                  {currentRoute.replace('-', ' ')} Module
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  This module is scheduled in the phased architecture plan. All database tables, foreign keys, and RBAC permissions are active in PostgreSQL.
                </p>
                <button
                  onClick={() => setCurrentRoute('employees')}
                  className="erp-btn-primary"
                >
                  Return to Employee Master
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
