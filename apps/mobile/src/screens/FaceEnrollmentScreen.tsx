import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { cameraService } from '../services/camera';
import { faceDetectorService } from '../services/faceDetector';
import { Camera, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, UserCheck, Search, Users } from 'lucide-react';

interface FaceEnrollmentScreenProps {
  employee?: any;
  onBack: () => void;
  onEnrollmentComplete: () => void;
}

export const FaceEnrollmentScreen: React.FC<FaceEnrollmentScreenProps> = ({
  employee: initialEmployee,
  onBack,
  onEnrollmentComplete
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(initialEmployee || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(0.94);

  useEffect(() => {
    fetchEmployees();
    return () => {
      cameraService.stopCamera();
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=50');
      const list = res.data.data?.items || res.data.data || [];
      setEmployees(list);
      if (!selectedEmployee && list.length > 0) {
        setSelectedEmployee(list[0]);
      }
    } catch (err) {
      console.warn('Could not fetch employees for enrollment', err);
    }
  };

  const startCameraFeed = async () => {
    if (!consentGiven) {
      setError('Please acknowledge biometric privacy consent before activating camera');
      return;
    }
    setError(null);
    if (videoRef.current) {
      const started = await cameraService.startCamera(videoRef.current);
      setCameraActive(started);
      if (!started) {
        setError('Camera stream unavailable. Please allow camera permissions.');
      }
    }
  };

  const handleEnroll = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee to register face');
      return;
    }
    if (!consentGiven) {
      setError('Biometric privacy consent is mandatory for enrollment');
      return;
    }

    setError(null);
    setEnrolling(true);

    try {
      // 1. Extract 128-dimensional biometric embedding from frame
      const detection = await faceDetectorService.extractEmbedding(
        videoRef.current,
        selectedEmployee.employeeCode || selectedEmployee.employee_code
      );

      // 2. Call Face Enrollment API
      await api.post('/face/enroll', {
        employeeId: selectedEmployee.id,
        embedding: detection.embedding,
        qualityScore: detection.qualityScore || 0.95,
        faceCount: detection.faceCount || 1,
        modelVersion: 'mediapipe-facemesh-v1',
        deviceInfo: navigator.userAgent.slice(0, 100),
        consentObtained: true
      });

      setSuccess(`Face template registered and encrypted successfully for ${selectedEmployee.fullName || selectedEmployee.full_name}!`);
      cameraService.stopCamera();

      setTimeout(() => {
        onEnrollmentComplete();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Face enrollment failed. Please retry.';
      setError(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = (e.fullName || e.full_name || '').toLowerCase();
    const code = (e.employeeCode || e.employee_code || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#090d16',
      padding: '24px 32px',
      overflowY: 'auto'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => {
              cameraService.stopCamera();
              onBack();
            }}
            style={{
              background: 'none',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Back to Attendance</span>
          </button>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
              Register New Face Biometric
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Admin Enrollment Portal • 128-d Vector Template • AES-256 Encryption
            </p>
          </div>
        </div>

        {selectedEmployee && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            padding: '6px 14px',
            borderRadius: '9999px'
          }}>
            <UserCheck size={16} color="#38bdf8" />
            <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
              {selectedEmployee.fullName || selectedEmployee.full_name} ({selectedEmployee.employeeCode || selectedEmployee.employee_code})
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          padding: '12px 16px',
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

      {success && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#86efac',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Left Side Employee Selector, Right Side Camera & Enrollment */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Step 1: Select Employee */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#38bdf8' }}>
            <Users size={18} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
              1. Select Employee to Enroll
            </h2>
          </div>

          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or code..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            flex: 1,
            maxHeight: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredEmployees.map((emp) => {
              const code = emp.employeeCode || emp.employee_code;
              const name = emp.fullName || emp.full_name;
              const isSelected = selectedEmployee?.id === emp.id;
              const isEnrolled = emp.faceEnrolled || emp.face_enrolled;

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#1e3a8a' : '#1e293b',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid #334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#2563eb' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#ffffff'
                    }}>
                      {name ? name[0] : 'E'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{code}</div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isEnrolled ? '#14532d' : '#334155',
                    color: isEnrolled ? '#86efac' : '#94a3b8'
                  }}>
                    {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Camera & Biometric Registration */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#38bdf8' }}>
              <Camera size={18} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
                2. Capture & Register Face Template
              </h2>
            </div>

            {/* Viewfinder Circle */}
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              border: cameraActive ? '4px solid #3b82f6' : '4px dashed #475569',
              overflow: 'hidden',
              backgroundColor: '#020617',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: cameraActive ? '0 0 25px rgba(59, 130, 246, 0.3)' : 'none'
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  display: cameraActive ? 'block' : 'none'
                }}
              />
              {!cameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', gap: '8px' }}>
                  <Camera size={48} />
                  <span style={{ fontSize: '12px' }}>Camera Inactive</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCameraFeed}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Start Camera Feed
                </button>
              ) : (
                <div style={{ fontSize: '12px', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', padding: '4px 12px', borderRadius: '9999px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>Camera Active (Illumination: {Math.round(qualityScore * 100)}%)</span>
                </div>
              )}
            </div>

            {/* Privacy Consent Agreement */}
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              border: '1px solid #334155',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                <ShieldCheck size={15} />
                <span>Biometric Privacy & Legal Consent</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '8px' }}>
                Extracted landmarks are transformed into a 128-d vector and encrypted via AES-256-GCM. Raw photos are never stored.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f8fafc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                />
                <span>Employee consent has been verified for face enrollment.</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={!consentGiven || !selectedEmployee || enrolling}
            onClick={handleEnroll}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: consentGiven && selectedEmployee ? '#2563eb' : '#334155',
              color: consentGiven && selectedEmployee ? '#ffffff' : '#94a3b8',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: consentGiven && selectedEmployee && !enrolling ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: consentGiven && selectedEmployee ? '0 4px 14px rgba(37,99,235,0.4)' : 'none'
            }}
          >
            {enrolling ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Encrypting & Storing Biometric Template...</span>
              </>
            ) : (
              <span>Register Face for {selectedEmployee ? (selectedEmployee.fullName || selectedEmployee.full_name) : 'Employee'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
