import React, { useState, useEffect } from 'react';
import { Building2, Bell, Shield, MapPin, Search } from 'lucide-react';

interface HeaderProps {
  user: any;
  units: any[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  units,
  selectedUnitId,
  onSelectUnit
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Left: Company & Unit Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
          <Building2 size={16} color="#475569" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
            {user?.companyName || 'BPF Technologies Pvt Ltd'}
          </span>
          <span style={{ fontSize: '11px', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 'bold' }}>
            {user?.companyCode || 'BPF-TECH'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color="#64748b" />
          <select
            value={selectedUnitId}
            onChange={(e) => onSelectUnit(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <option value="">All Operating Units (3 Units)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Clock, Alerts & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Live Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
            {currentTime || '--:--:-- --'} IST
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {todayStr}
          </div>
        </div>

        <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

        {/* Notifications */}
        <button
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px'
          }}
          title="Notifications"
        >
          <Bell size={18} color="#475569" />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }} />
        </button>

        {/* Security / Role Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
          <Shield size={14} color="#16a34a" />
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#15803d' }}>
            Verified Session
          </span>
        </div>
      </div>
    </header>
  );
};
