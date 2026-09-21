import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ArrowLeft, Clock, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AttendanceHistoryScreenProps {
  employee: any;
  onBack: () => void;
}

export const AttendanceHistoryScreen: React.FC<AttendanceHistoryScreenProps> = ({
  employee,
  onBack
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/my-history?employeeId=${employee.id}&limit=30`);
      setHistory(res.data.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, lateMinutes: number) => {
    if (status === 'PRESENT' && lateMinutes > 0) {
      return (
        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>
          LATE ({lateMinutes}m)
        </span>
      );
    }
    if (status === 'PRESENT') {
      return (
        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>
          PRESENT
        </span>
      );
    }
    if (status === 'HALF_DAY') {
      return (
        <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>
          HALF DAY
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      overflowY: 'auto',
      backgroundColor: '#0f172a'
    }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              Attendance Register
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              Past 30 Days Record
            </p>
          </div>
        </div>

        {/* List of Punches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Loading attendance history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No punch history recorded for this month.
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                    <Calendar size={14} color="#38bdf8" />
                    <span>{record.attendance_date}</span>
                  </div>
                  {getStatusBadge(record.status, record.late_minutes)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  <div>
                    <span>IN: </span>
                    <strong style={{ color: '#22c55e' }}>{record.in_time ? record.in_time.slice(0, 5) : '--:--'}</strong>
                  </div>
                  <div>
                    <span>OUT: </span>
                    <strong style={{ color: '#ef4444' }}>{record.out_time ? record.out_time.slice(0, 5) : '--:--'}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span>HOURS: </span>
                    <strong style={{ color: '#ffffff' }}>{record.total_work_hours || 0}h</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', paddingBottom: '4px' }}>
        Verified via Central PostgreSQL Sync
      </div>
    </div>
  );
};
