import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireMinRole, requireRestaurantAccess } from '../middleware/rbac';
import { UserRole } from '../types/enums';

const router = Router({ mergeParams: true });

// Dashboard requires authentication and at least viewer role
router.use(authenticate);
router.use(requireRestaurantAccess);
router.use(requireMinRole(UserRole.VIEWER));

// GET /organizations/:orgId/dashboard/stats
router.get('/stats',
  (req, res, next) => dashboardController.getStats(req, res, next)
);

// GET /organizations/:orgId/dashboard/trend
router.get('/trend',
  (req, res, next) => dashboardController.getTrend(req, res, next)
);

export default router;
