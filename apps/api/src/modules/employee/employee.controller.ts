import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service.js';
import { EmployeeCreateSchema, EmployeeUpdateSchema } from '@bpf/validation';

export class EmployeeController {
  static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const unitId = req.query.unitId as string;
      const departmentId = req.query.departmentId as string;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      // Sensitive PII masking: Super Admin, HR Manager, and Payroll Manager can see full bank/PAN/salary
      const hasSensitiveAccess =
        req.user?.roles.some((r) => ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE'].includes(r)) || false;

      const result = await EmployeeService.getEmployees(
        { companyId: companyId!, unitId, departmentId, status, search, page, pageSize },
        hasSensitiveAccess
      );

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const isSelf = req.user?.employeeId === req.params.id;
      const hasSensitiveAccess =
        isSelf ||
        req.user?.roles.some((r) => ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'].includes(r)) ||
        false;

      const emp = await EmployeeService.getEmployeeById(String(req.params.id), hasSensitiveAccess);
      return res.status(200).json({
        success: true,
        data: emp
      });
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        ...req.body,
        companyId: req.user?.companyId || req.body.companyId
      };
      const validated = EmployeeCreateSchema.parse(payload);
      const created = await EmployeeService.createEmployee(validated, req.user?.id);

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = EmployeeUpdateSchema.parse(req.body);
      const updated = await EmployeeService.updateEmployee(String(req.params.id), validated, req.user?.id);

      return res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async deactivateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { exitDate, exitReason } = req.body;
      if (!exitDate || !exitReason) {
        return res.status(400).json({
          success: false,
          message: 'Exit date and reason are required',
          code: 'MISSING_EXIT_FIELDS'
        });
      }

      const deactivated = await EmployeeService.deactivateEmployee(
        String(req.params.id),
        exitDate,
        exitReason,
        req.user?.id
      );

      return res.status(200).json({
        success: true,
        message: 'Employee marked as exited',
        data: deactivated
      });
    } catch (err) {
      next(err);
    }
  }
}
