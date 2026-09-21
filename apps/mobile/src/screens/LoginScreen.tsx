import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Lock, Building, ArrowRight, AlertCircle, Sparkles, Mail } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (admin: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [companyCode, setCompanyCode] = useState('BPF-TECH');
  const [username, setUsername] = useState('admin@bpfpayroll.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        companyCode,
        username,
        password
      });

      const { user, tokens } = res.data.data;
      localStorage.setItem('bpf_mobile_token', tokens.accessToken);
      localStorage.setItem('bpf_mobile_admin', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Admin authentication failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (u: string, p: string) => {
    setCompanyCode('BPF-TECH');
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(ellipse at top, #1e293b 0%, #090d16 80%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: '36px 32px'
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(37,99,235,0.4)',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
            BPF Face Attendance
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Authorized Administrator & Kiosk Portal
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Company Code */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>
              COMPANY CODE
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '12px' }} />
              <input
                type="text"
                required
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="BPF-TECH"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Admin Email or Username */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>
              ADMIN EMAIL / USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '12px' }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@bpfpayroll.com"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Admin Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '12px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
              transition: 'background-color 0.2s'
            }}
          >
            <span>{loading ? 'Authenticating Admin...' : 'Enter Attendance System'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Admin Demo Credentials */}
        <div style={{ marginTop: '28px', padding: '14px', backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: '700', marginBottom: '10px' }}>
            <Sparkles size={13} />
            <span>QUICK ADMIN DEMO PRESETS</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => selectPreset('admin@bpfpayroll.com', 'admin123')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: '700', color: '#ffffff' }}>Super Admin</div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>admin123</div>
            </button>
            <button
              type="button"
              onClick={() => selectPreset('hr@bpfpayroll.com', 'hr123')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: '700', color: '#ffffff' }}>HR Manager</div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>hr123</div>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '20px' }}>
          BPF Payroll Security • AES-256 Vector Encryption • Kiosk Mode
        </div>
      </div>
    </div>
  );
};
