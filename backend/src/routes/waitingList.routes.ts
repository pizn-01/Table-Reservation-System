import { Router } from 'express';
import { waitingListController } from '../controllers/waitingList.controller';
import { authenticate } from '../middleware/auth';
import { requireMinRole, requireRestaurantAccess } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { createWaitingListSchema, updateWaitingListStatusSchema } from '../validators/waitingList.validator';
import { UserRole } from '../types/enums';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);
router.use(requireRestaurantAccess);

// GET /organizations/:orgId/waiting-list
router.get('/',
  requireMinRole(UserRole.HOST),
  (req, res, next) => waitingListController.list(req, res, next)
);

// POST /organizations/:orgId/waiting-list
router.post('/',
  requireMinRole(UserRole.HOST),
  validate(createWaitingListSchema),
  (req, res, next) => waitingListController.add(req, res, next)
);

// PATCH /organizations/:orgId/waiting-list/:id/status
router.patch('/:id/status',
  requireMinRole(UserRole.HOST),
  validate(updateWaitingListStatusSchema),
  (req, res, next) => waitingListController.updateStatus(req, res, next)
);

// DELETE /organizations/:orgId/waiting-list/:id
router.delete('/:id',
  requireMinRole(UserRole.HOST),
  (req, res, next) => waitingListController.remove(req, res, next)
);

export default router;
