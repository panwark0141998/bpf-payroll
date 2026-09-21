import { Router } from 'express';
import { CompanyController } from './company.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/companies', requirePermission('company', 'view'), CompanyController.getCompanies);
router.get('/companies/:id', requirePermission('company', 'view'), CompanyController.getCompanyById);
router.put('/companies/:id', requirePermission('company', 'edit'), CompanyController.updateCompany);

router.get('/companies/:companyId/units', requirePermission('unit', 'view'), CompanyController.getUnits);
router.post('/companies/:companyId/units', requirePermission('unit', 'create'), CompanyController.createUnit);
router.put('/units/:id', requirePermission('unit', 'edit'), CompanyController.updateUnit);

router.get('/departments', CompanyController.getDepartments);
router.get('/designations', CompanyController.getDesignations);

export default router;
