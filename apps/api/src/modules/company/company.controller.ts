import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './company.service.js';
import { CompanySchema, UnitSchema } from '@bpf/validation';

export class CompanyController {
  static async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await CompanyService.getCompanies();
      return res.status(200).json({ success: true, data: companies });
    } catch (err) {
      next(err);
    }
  }

  static async getCompanyById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.getCompanyById(String(req.params.id));
      return res.status(200).json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  static async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CompanySchema.partial().parse(req.body);
      const updated = await CompanyService.updateCompany(String(req.params.id), validated, req.user?.id);
      return res.status(200).json({ success: true, message: 'Company updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.params.companyId as string) || req.user?.companyId;
      const units = await CompanyService.getUnits(companyId!);
      return res.status(200).json({ success: true, data: units });
    } catch (err) {
      next(err);
    }
  }

  static async createUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.params.companyId as string) || req.user?.companyId;
      const validated = UnitSchema.omit({ companyId: true }).parse(req.body);
      const unit = await CompanyService.createUnit(companyId!, validated, req.user?.id);
      return res.status(201).json({ success: true, message: 'Unit created', data: unit });
    } catch (err) {
      next(err);
    }
  }

  static async updateUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UnitSchema.partial().parse(req.body);
      const unit = await CompanyService.updateUnit(String(req.params.id), validated, req.user?.id);
      return res.status(200).json({ success: true, message: 'Unit updated', data: unit });
    } catch (err) {
      next(err);
    }
  }

  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.query.companyId as string) || req.user?.companyId;
      const depts = await CompanyService.getDepartments(companyId!);
      return res.status(200).json({ success: true, data: depts });
    } catch (err) {
      next(err);
    }
  }

  static async getDesignations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.query.companyId as string) || req.user?.companyId;
      const desigs = await CompanyService.getDesignations(companyId!);
      return res.status(200).json({ success: true, data: desigs });
    } catch (err) {
      next(err);
    }
  }
}
