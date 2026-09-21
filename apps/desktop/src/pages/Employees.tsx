import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Camera,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
  Building,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface EmployeesProps {
  user: any;
  selectedUnitId: string;
}

export const Employees: React.FC<EmployeesProps> = ({ user, selectedUnitId }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'employment' | 'statutory' | 'salary'>('personal');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    employeeCode: '',
    dateOfBirth: '1995-01-01',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    mobile: '',
    email: '',
    address: 'Tech Park Avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    dateOfJoining: '2026-04-01',
    employmentType: 'FULL_TIME',
    workStatus: 'OFFICE',
    unitId: '',
    departmentId: '',
    designationId: '',
    // Statutory & Bank
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0001234',
    panNumber: '',
    aadhaarRef: '',
    uanNumber: '',
    esicNumber: '',
    pfApplicable: true,
    esicApplicable: true,
    ptApplicable: true,
    tdsApplicable: false,
    // Salary
    ctcAnnual: 600000,
    grossMonthly: 50000,
    basic: 25000,
    hra: 12500,
    conveyance: 5000,
    specialAllowance: 7500
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [selectedUnitId, departmentFilter, statusFilter, search]);

  const fetchMetadata = async () => {
    try {
      const [uRes, dRes, desRes] = await Promise.all([
        api.get(`/companies/${user?.companyId}/units`),
        api.get('/departments'),
        api.get('/designations')
      ]);
      setUnits(uRes.data.data);
      setDepartments(dRes.data.data);
      setDesignations(desRes.data.data);

      if (uRes.data.data.length > 0 && !formData.unitId) {
        setFormData((prev: any) => ({
          ...prev,
          unitId: uRes.data.data[0].id,
          departmentId: dRes.data.data[0]?.id || '',
          designationId: desRes.data.data[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedUnitId) params.append('unitId', selectedUnitId);
      if (departmentFilter) params.append('departmentId', departmentFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await api.post('/employees', formData);
      setIsModalOpen(false);
      fetchEmployees();
      alert('Employee enrolled successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create employee';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Employee Master Register
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Manage workforce profiles, biographical data, statutory parameters, and face biometrics.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setModalTab('personal');
          }}
          className="erp-btn-primary"
        >
          <Plus size={16} />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
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
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by Employee Code, Name, Email or Mobile..."
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

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
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
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
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
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="EXITED">Exited</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
          Showing {employees.length} of {total} Records
        </div>
      </div>

      {/* Employees Data Table */}
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
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>FULL NAME</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>DEPARTMENT</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>DESIGNATION</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>UNIT</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>MOBILE / CONTACT</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>FACE STATUS</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading employees register...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No employee records match the given criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr
                  key={emp.id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#2563eb', fontFamily: 'monospace' }}>
                    {emp.employee_code}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{emp.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {emp.department_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {emp.designation_title}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {emp.unit_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155', fontFamily: 'monospace' }}>
                    {emp.mobile}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {emp.face_enrolled ? (
                      <span className="erp-badge erp-badge-success" style={{ gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>Enrolled</span>
                      </span>
                    ) : (
                      <span className="erp-badge erp-badge-warning" style={{ gap: '4px' }}>
                        <Camera size={12} />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`erp-badge ${emp.status === 'ACTIVE' ? 'erp-badge-success' : 'erp-badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setViewDetailModal(emp)}
                      className="erp-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal */}
      {viewDetailModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '640px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  {viewDetailModal.full_name} ({viewDetailModal.employee_code})
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {viewDetailModal.designation_title} • {viewDetailModal.department_name}
                </span>
              </div>
              <button
                onClick={() => setViewDetailModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>OPERATING UNIT</span>
                <strong>{viewDetailModal.unit_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>DATE OF JOINING</span>
                <strong>{viewDetailModal.date_of_joining}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>OFFICIAL EMAIL</span>
                <strong>{viewDetailModal.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>REGISTERED MOBILE</span>
                <strong>{viewDetailModal.mobile}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>BANK NAME</span>
                <strong>{viewDetailModal.bank_name || 'HDFC Bank'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>ACCOUNT NUMBER</span>
                <strong style={{ fontFamily: 'monospace' }}>{viewDetailModal.account_number || 'XXXXXXXX5678'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>PAN NUMBER</span>
                <strong style={{ fontFamily: 'monospace' }}>{viewDetailModal.pan_number || 'ABCDE1234F'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>AADHAAR REF</span>
                <strong style={{ fontFamily: 'monospace' }}>{viewDetailModal.aadhaar_ref || 'XXXXXXXX1012'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setViewDetailModal(null)}
                className="erp-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Employee Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Enroll New Employee
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Create Master record, assign unit, configure statutory profile & salary structure.
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {formError && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              {[
                { id: 'personal', label: '1. Personal Profile' },
                { id: 'employment', label: '2. Employment & Unit' },
                { id: 'statutory', label: '3. Bank & Statutory' },
                { id: 'salary', label: '4. Salary Structure' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: modalTab === tab.id ? '700' : '500',
                    color: modalTab === tab.id ? '#2563eb' : '#64748b',
                    borderBottom: modalTab === tab.id ? '2px solid #2563eb' : 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateEmployee}>
              {/* Tab 1: Personal */}
              {modalTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Employee Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BPF011"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Mobile Number (10 digits) *</label>
                    <input
                      type="text"
                      required
                      placeholder="9820000000"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="employee@bpfpayroll.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Employment */}
              {modalTab === 'employment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Assigned Unit *</label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Department *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Designation *</label>
                    <select
                      value={formData.designationId}
                      onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      {designations.map((ds) => (
                        <option key={ds.id} value={ds.id}>{ds.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Date of Joining *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfJoining}
                      onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Statutory & Bank */}
              {modalTab === 'statutory' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Account Number</label>
                    <input
                      type="text"
                      placeholder="50100234567890"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>IFSC Code</label>
                    <input
                      type="text"
                      placeholder="HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px', paddingTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={formData.pfApplicable}
                        onChange={(e) => setFormData({ ...formData, pfApplicable: e.target.checked })}
                      />
                      <span>PF Applicable</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={formData.esicApplicable}
                        onChange={(e) => setFormData({ ...formData, esicApplicable: e.target.checked })}
                      />
                      <span>ESIC Applicable</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={formData.ptApplicable}
                        onChange={(e) => setFormData({ ...formData, ptApplicable: e.target.checked })}
                      />
                      <span>PT Applicable</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Salary */}
              {modalTab === 'salary' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Annual CTC (₹)</label>
                    <input
                      type="number"
                      value={formData.ctcAnnual}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const gross = Math.round(val / 12);
                        setFormData({
                          ...formData,
                          ctcAnnual: val,
                          grossMonthly: gross,
                          basic: Math.round(gross * 0.5),
                          hra: Math.round(gross * 0.25)
                        });
                      }}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Monthly Gross (₹)</label>
                    <input
                      type="number"
                      value={formData.grossMonthly}
                      onChange={(e) => setFormData({ ...formData, grossMonthly: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={formData.basic}
                      onChange={(e) => setFormData({ ...formData, basic: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>HRA (₹)</label>
                    <input
                      type="number"
                      value={formData.hra}
                      onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="erp-btn-secondary"
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {modalTab !== 'salary' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'personal') setModalTab('employment');
                        else if (modalTab === 'employment') setModalTab('statutory');
                        else if (modalTab === 'statutory') setModalTab('salary');
                      }}
                      className="erp-btn-secondary"
                    >
                      Next Step &rarr;
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="erp-btn-primary"
                  >
                    {submitting ? 'Saving Record...' : 'Complete Enrollment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
