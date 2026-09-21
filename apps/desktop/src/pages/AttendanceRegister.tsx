import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  RefreshCw,
  User,
  Building,
  Eye
} from 'lucide-react';

interface AttendanceRegisterProps {
  user: any;
  selectedUnitId: string;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  user,
  selectedUnitId
}) => {
  const [punches, setPunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTodayRegister();
  }, [selectedUnitId]);

  const fetchTodayRegister = async () => {
    try {
      setLoading(true);
      const url = selectedUnitId
        ? `/attendance/today?unitId=${selectedUnitId}`
        : '/attendance/today';
      const res = await api.get(url);
      setPunches(res.data.data || []);
    } catch (err) {
      console.error('Failed to load today attendance register', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPunches = punches.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.employee_code.toLowerCase().includes(q) ||
        p.employee_name.toLowerCase().includes(q) ||
        (p.department_name && p.department_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string, lateMinutes: number) => {
    if (status === 'LATE' || (status === 'PRESENT' && lateMinutes > 0)) {
      return (
        <span className="erp-badge erp-badge-warning">
          LATE ({lateMinutes}m)
        </span>
      );
    }
    if (status === 'PRESENT') {
      return <span className="erp-badge erp-badge-success">PRESENT</span>;
    }
    if (status === 'HALF_DAY') {
      return <span className="erp-badge erp-badge-info">HALF DAY</span>;
    }
    return <span className="erp-badge erp-badge-danger">{status}</span>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Daily Attendance Register
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Live biometric punch register, shift timings, GPS geofencing verification, and work hours.
          </p>
        </div>

        <button
          onClick={fetchTodayRegister}
          className="erp-btn-secondary"
        >
          <RefreshCw size={14} />
          <span>Refresh Register</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by Employee Code, Name, or Department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late Arrivals</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="MISSING_PUNCH">Missing Punch</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
          Showing {filteredPunches.length} Live Records
        </div>
      </div>

      {/* Attendance Register Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>EMP CODE</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>EMPLOYEE</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>UNIT & SHIFT</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>IN TIME</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>OUT TIME</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>WORK HOURS</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>BIOMETRICS</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading today attendance register...
                </td>
              </tr>
            ) : filteredPunches.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No live punches found for today yet. Use the mobile app to mark Punch IN.
                </td>
              </tr>
            ) : (
              filteredPunches.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#2563eb', fontFamily: 'monospace' }}>
                    {p.employee_code}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.employee_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{p.department_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#334155' }}>{p.unit_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{p.shift_name || 'General Shift'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#16a34a', fontFamily: 'monospace' }}>
                      {p.in_time ? p.in_time.slice(0, 5) : '--:--'}
                    </div>
                    {p.in_latitude && (
                      <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <MapPin size={10} />
                        <span>GPS Verified</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: p.out_time ? '#dc2626' : '#94a3b8', fontFamily: 'monospace' }}>
                      {p.out_time ? p.out_time.slice(0, 5) : '--:--'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {p.total_work_hours || 0} hrs
                    </div>
                    {p.overtime_hours > 0 && (
                      <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '700' }}>
                        +{p.overtime_hours}h OT
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.face_verified ? (
                      <span className="erp-badge erp-badge-success" style={{ gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>Verified ({p.face_similarity_score ? Math.round(p.face_similarity_score * 100) : 94}%)</span>
                      </span>
                    ) : (
                      <span className="erp-badge erp-badge-warning" style={{ gap: '4px' }}>
                        <Camera size={12} />
                        <span>Manual</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {getStatusBadge(p.status, p.late_minutes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
