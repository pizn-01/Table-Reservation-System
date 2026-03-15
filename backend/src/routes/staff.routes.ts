import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth';
import { requireMinRole, requireRestaurantAccess } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { inviteStaffSchema, updateStaffSchema } from '../validators/staff.validator';
import { UserRole } from '../types/enums';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);
router.use(requireRestaurantAccess);

// GET /organizations/:orgId/staff
router.get('/',
  requireMinRole(UserRole.MANAGER),
  (req, res, next) => staffController.list(req, res, next)
);

// POST /organizations/:orgId/staff/invite
router.post('/invite',
  requireMinRole(UserRole.MANAGER),
  validate(inviteStaffSchema),
  (req, res, next) => staffController.invite(req, res, next)
);

// GET /organizations/:orgId/staff/:id
router.get('/:id',
  requireMinRole(UserRole.MANAGER),
  (req, res, next) => staffController.getById(req, res, next)
);

// PUT /organizations/:orgId/staff/:id
router.put('/:id',
  requireMinRole(UserRole.MANAGER),
  validate(updateStaffSchema),
  (req, res, next) => staffController.update(req, res, next)
);

// DELETE /organizations/:orgId/staff/:id
router.delete('/:id',
  requireMinRole(UserRole.RESTAURANT_ADMIN),
  (req, res, next) => staffController.remove(req, res, next)
);

export default router;
