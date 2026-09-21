import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Building,
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  user: any;
  selectedUnitId: string;
  onNavigate: (route: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  selectedUnitId,
  onNavigate
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [selectedUnitId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const url = selectedUnitId
        ? `/dashboard/metrics?unitId=${selectedUnitId}`
        : '/dashboard/metrics';
      const res = await api.get(url);
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: 'TOTAL HEADCOUNT',
      value: metrics?.totalEmployees ?? 10,
      sub: `${metrics?.activeEmployees ?? 10} Active in Records`,
      icon: Users,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      label: 'PRESENT TODAY',
      value: metrics?.presentToday ?? 8,
      sub: 'Face / GPS Verified',
      icon: UserCheck,
      color: '#16a34a',
      bg: '#f0fdf4'
    },
    {
      label: 'ABSENT TODAY',
      value: metrics?.absentToday ?? 1,
      sub: 'Unscheduled Absence',
      icon: UserX,
      color: '#dc2626',
      bg: '#fef2f2'
    },
    {
      label: 'ON APPROVED LEAVE',
      value: metrics?.onLeaveToday ?? 1,
      sub: 'Paid & Casual Leave',
      icon: CalendarCheck,
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    {
      label: 'LATE ARRIVALS',
      value: metrics?.lateToday ?? 1,
      sub: 'Beyond Shift Grace',
      icon: Clock,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      label: 'PENDING APPROVALS',
      value: (metrics?.pendingLeaveApprovals ?? 0) + (metrics?.pendingRegularizations ?? 0),
      sub: `${metrics?.pendingLeaveApprovals ?? 0} Leave, ${metrics?.pendingRegularizations ?? 0} Punches`,
      icon: AlertTriangle,
      color: '#7c3aed',
      bg: '#f5f3ff'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        backgroundColor: '#ffffff',
        padding: '20px 24px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Welcome back, {user?.fullName || 'Administrator'}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Workforce Overview and Attendance Statistics for today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigate('employees')}
            className="erp-btn-secondary"
          >
            <Users size={16} />
            <span>Manage Employees</span>
          </button>
          <button
            onClick={() => onNavigate('payroll')}
            className="erp-btn-primary"
          >
            <TrendingUp size={16} />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>
                  {c.label}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: c.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                {loading ? '...' : c.value}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Department Distribution & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Department Manpower Breakdown */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Department Headcount & Allocation
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>5 Departments</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { name: 'Engineering & Technology', count: 4, pct: 40, color: '#2563eb' },
              { name: 'Human Resources', count: 2, pct: 20, color: '#10b981' },
              { name: 'Finance & Accounts', count: 2, pct: 20, color: '#f59e0b' },
              { name: 'Operations & Manufacturing', count: 2, pct: 20, color: '#8b5cf6' }
            ].map((dept, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', color: '#334155' }}>{dept.name}</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{dept.count} Members ({dept.pct}%)</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${dept.pct}%`, backgroundColor: dept.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Units Summary */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Operating Units & Geofences
            </h3>
            <span className="erp-badge erp-badge-success">3 Online</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'Head Office - Mumbai', loc: 'Powai (100m Geofence)', status: 'Active', count: '5 Employees' },
              { name: 'Manufacturing Plant - Pune', loc: 'Chakan MIDC (150m Geofence)', status: 'Active', count: '2 Employees' },
              { name: 'Tech Innovation Hub - Bengaluru', loc: 'Whitefield (120m Geofence)', status: 'Active', count: '3 Employees' }
            ].map((u, i) => (
              <div key={i} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{u.name}</div>
                  <CheckCircle2 size={14} color="#16a34a" />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{u.loc} • {u.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
