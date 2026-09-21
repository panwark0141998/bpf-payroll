import { Router } from 'express';
import { EmployeeController } from './employee.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('employee', 'view'), EmployeeController.getEmployees);
router.get('/:id', requirePermission('employee', 'view'), EmployeeController.getEmployeeById);
router.post('/', requirePermission('employee', 'create'), EmployeeController.createEmployee);
router.put('/:id', requirePermission('employee', 'edit'), EmployeeController.updateEmployee);
router.post('/:id/deactivate', requirePermission('employee', 'delete'), EmployeeController.deactivateEmployee);

export default router;
