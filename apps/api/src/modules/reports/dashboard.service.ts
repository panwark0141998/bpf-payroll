import { db } from '../../database/db.js';

export class DashboardService {
  static async getMetrics(companyId: string, unitId?: string) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7); // YYYY-MM

    // 1. Employee Counts
    const empRes = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active
       FROM employees
       WHERE company_id = $1 ${unitId ? 'AND unit_id = $2' : ''};`,
      unitId ? [companyId, unitId] : [companyId]
    );
    const totalEmployees = parseInt(empRes.rows[0]?.total || '0', 10);
    const activeEmployees = parseInt(empRes.rows[0]?.active || '0', 10);

    // 2. Today's Attendance Counts
    const attRes = await db.query(
      `SELECT 
         COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
         COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
         COUNT(CASE WHEN status = 'LEAVE' THEN 1 END) as leave,
         COUNT(CASE WHEN late_minutes > 0 THEN 1 END) as late,
         COUNT(CASE WHEN in_time IS NOT NULL AND out_time IS NULL THEN 1 END) as missing_punch,
         COUNT(CASE WHEN overtime_hours > 0 THEN 1 END) as overtime
       FROM attendance
       WHERE company_id = $1 AND attendance_date = $2 ${unitId ? 'AND unit_id = $3' : ''};`,
      unitId ? [companyId, today, unitId] : [companyId, today]
    );
    const att = attRes.rows[0] || {};

    // 3. Pending Approvals
    const leaveAppRes = await db.query(
      `SELECT COUNT(*) as pending FROM leave_applications la
       JOIN employees e ON la.employee_id = e.id
       WHERE e.company_id = $1 AND la.status = 'PENDING';`,
      [companyId]
    );

    const regRes = await db.query(
      `SELECT COUNT(*) as pending FROM attendance_regularization ar
       JOIN employees e ON ar.employee_id = e.id
       WHERE e.company_id = $1 AND ar.status = 'PENDING';`,
      [companyId]
    );

    // 4. Department Manpower Breakdown
    const deptRes = await db.query(
      `SELECT d.name as department, COUNT(e.id) as count
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'ACTIVE'
       WHERE d.company_id = $1
       GROUP BY d.id, d.name
       ORDER BY count DESC;`,
      [companyId]
    );

    // 5. 7-Day Attendance Trend
    const trendRes = await db.query(
      `SELECT 
         attendance_date::text as date,
         COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
         COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
         COUNT(CASE WHEN status = 'LEAVE' THEN 1 END) as leave
       FROM attendance
       WHERE company_id = $1 AND attendance_date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY attendance_date
       ORDER BY attendance_date ASC;`,
      [companyId]
    );

    return {
      totalEmployees,
      activeEmployees,
      presentToday: parseInt(att.present || '0', 10),
      absentToday: parseInt(att.absent || '0', 10),
      onLeaveToday: parseInt(att.leave || '0', 10),
      lateToday: parseInt(att.late || '0', 10),
      missingPunchesToday: parseInt(att.missing_punch || '0', 10),
      overtimeEmployeesToday: parseInt(att.overtime || '0', 10),
      pendingLeaveApprovals: parseInt(leaveAppRes.rows[0]?.pending || '0', 10),
      pendingRegularizations: parseInt(regRes.rows[0]?.pending || '0', 10),
      departmentAttendanceBreakdown: deptRes.rows.map((r: any) => ({
        department: r.department,
        count: parseInt(r.count, 10),
        presentRate: activeEmployees > 0 ? Math.round((parseInt(r.count, 10) / activeEmployees) * 100) : 0
      })),
      attendanceTrend7Days: trendRes.rows.map((r: any) => ({
        date: r.date,
        present: parseInt(r.present, 10),
        absent: parseInt(r.absent, 10),
        leave: parseInt(r.leave, 10)
      }))
    };
  }
}
