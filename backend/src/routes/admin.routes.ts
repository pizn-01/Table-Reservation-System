import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireMinRole } from '../middleware/rbac';
import { UserRole } from '../types/enums';

const router = Router();

// All admin routes require super admin authentication
router.use(authenticate);
router.use(requireMinRole(UserRole.SUPER_ADMIN));

// GET /admin/organizations
router.get('/organizations',
  (req, res, next) => adminController.listOrganizations(req, res, next)
);

// GET /admin/organizations/:id
router.get('/organizations/:id',
  (req, res, next) => adminController.getOrganization(req, res, next)
);

// PUT /admin/organizations/:id
router.put('/organizations/:id',
  (req, res, next) => adminController.updateOrganization(req, res, next)
);

// PATCH /admin/organizations/:id/status
router.patch('/organizations/:id/status',
  (req, res, next) => adminController.toggleOrgStatus(req, res, next)
);

// GET /admin/stats
router.get('/stats',
  (req, res, next) => adminController.getPlatformStats(req, res, next)
);

// GET /admin/users
router.get('/users',
  (req, res, next) => adminController.listUsers(req, res, next)
);

// GET /admin/settings
router.get('/settings',
  (req, res, next) => adminController.getSettings(req, res, next)
);

// PUT /admin/settings/:key
router.put('/settings/:key',
  (req, res, next) => adminController.updateSetting(req, res, next)
);

// GET /admin/audit-log
router.get('/audit-log',
  (req, res, next) => adminController.getAuditLog(req, res, next)
);

export default router;
