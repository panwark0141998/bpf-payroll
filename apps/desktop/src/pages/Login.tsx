import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Lock, Mail, Building, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [companyCode, setCompanyCode] = useState('BPF-TECH');
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin@bpfpayroll.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        companyCode,
        usernameOrEmail,
        password,
        rememberMe
      });

      const { user, tokens } = res.data.data;
      localStorage.setItem('bpf_access_token', tokens.accessToken);
      localStorage.setItem('bpf_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (userEmail: string, pass: string) => {
    setCompanyCode('BPF-TECH');
    setUsernameOrEmail(userEmail);
    setPassword(pass);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left Column: Branding & Overview */}
      <div style={{
        flex: 1,
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid #334155'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '22px',
              color: '#ffffff'
            }}>
              BPF
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>BPF PAYROLL</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Enterprise Windows Desktop Suite</div>
            </div>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px', color: '#ffffff' }}>
            Total Workforce & Payroll Automation
          </h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '480px', marginBottom: '36px' }}>
            Integrated Mobile Biometric Face Attendance with GPS Geofencing, Shift Rostering, and automated Statutory Payroll Engine.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Dual-Engine DB</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Embedded PostgreSQL 16 + External pg.Pool compatibility</div>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Face Biometrics</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>128-dim encrypted vector matching with anti-spoof checks</div>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>ACID Payroll Engine</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Configurable PF, ESIC, PT, TDS & LOP calculations</div>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Audit & RBAC</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>11 granular roles with immutable audit logging</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b' }}>
          © 2026 BPF Technologies Private Limited. All rights reserved.
        </div>
      </div>

      {/* Right Column: Secure Login Form */}
      <div style={{
        width: '480px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#0b1120'
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', color: '#38bdf8', marginBottom: '16px' }}>
            <ShieldCheck size={14} />
            <span>Authorized Enterprise Access</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Sign in to Desktop ERP</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
            Enter your company code and credentials.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fca5a5',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Company Code */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Company Code
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BPF-TECH"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Email / Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                User ID / Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2563eb' }}
                />
                Remember this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Login Presets for Pair Programming */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '12px' }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>TEST CREDENTIAL PRESETS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => applyPreset('admin@bpfpayroll.com', 'admin123')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600' }}>Super Admin</div>
                <div style={{ color: '#64748b' }}>admin123</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('hr@bpfpayroll.com', 'hr123')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600' }}>HR Manager</div>
                <div style={{ color: '#64748b' }}>hr123</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('payroll@bpfpayroll.com', 'payroll123')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600' }}>Payroll Admin</div>
                <div style={{ color: '#64748b' }}>payroll123</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('supervisor@bpfpayroll.com', 'sup123')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600' }}>Shift Supervisor</div>
                <div style={{ color: '#64748b' }}>sup123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
