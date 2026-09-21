import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  Calculator,
  HandCoins,
  FileBarChart,
  FileText,
  Settings,
  ShieldCheck,
  History,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  user,
  onLogout
}) => {
  const menuGroups = [
    {
      title: 'CORE MANAGEMENT',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'employees', label: 'Employee Master', icon: Users },
        { id: 'attendance', label: 'Attendance Register', icon: Clock },
        { id: 'shifts', label: 'Shifts & Rosters', icon: CalendarDays },
        { id: 'leave', label: 'Leave & Holidays', icon: CalendarCheck }
      ]
    },
    {
      title: 'COMPENSATION & PAYROLL',
      items: [
        { id: 'salary', label: 'Salary Structure', icon: CreditCard },
        { id: 'overtime', label: 'Overtime & Claims', icon: TrendingUp },
        { id: 'loans', label: 'Loans & Advances', icon: HandCoins },
        { id: 'payroll', label: 'Monthly Payroll', icon: Calculator }
      ]
    },
    {
      title: 'ANALYTICS & COMPLIANCE',
      items: [
        { id: 'reports', label: 'HR & Statutory Reports', icon: FileBarChart },
        { id: 'documents', label: 'Document Archive', icon: FileText },
        { id: 'audit', label: 'Audit Trail', icon: History }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'users', label: 'Users & RBAC Roles', icon: ShieldCheck },
        { id: 'settings', label: 'Company Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside style={{ width: '260px', minWidth: '260px', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#e2e8f0', borderRight: '1px solid #1e293b' }}>
      {/* Brand Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>
          BPF
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '0.5px', color: '#f8fafc' }}>BPF PAYROLL</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Enterprise HR & Attendance</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: '#64748b', padding: '0 12px 8px 12px' }}>
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Info & Logout Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.fullName || 'Administrator'}
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              {user?.roles?.[0] || 'SUPER_ADMIN'}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
          BPF Payroll v1.0 • Enterprise Edition
        </div>
      </div>
    </aside>
  );
};
