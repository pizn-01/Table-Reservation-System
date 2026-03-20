import { Router } from 'express';
import { reservationController } from '../controllers/reservation.controller';
import { authenticateApiKeyForRestaurant } from '../middleware/apiKeyAuth';
import { validate } from '../middleware/validator';
import {
  createReservationSchema,
  updateReservationSchema,
  updateReservationStatusSchema,
  reservationFilterSchema,
} from '../validators/reservation.validator';

const router = Router({ mergeParams: true });

// All POS routes use API key auth.
router.use(authenticateApiKeyForRestaurant);

// POS can list reservations for sync/ops views.
router.get('/',
  validate(reservationFilterSchema, 'query'),
  (req, res, next) => reservationController.list(req, res, next)
);

// POS can create reservation entries (source=pos in payload or caller).
router.post('/',
  validate(createReservationSchema),
  (req, _res, next) => {
    req.body = { ...req.body, source: 'pos' };
    next();
  },
  (req, res, next) => reservationController.create(req, res, next)
);

// POS can update reservation details.
router.put('/:id',
  validate(updateReservationSchema),
  (req, res, next) => reservationController.update(req, res, next)
);

// POS can drive lifecycle state changes (arriving/seated/completed/cancelled).
router.patch('/:id/status',
  validate(updateReservationStatusSchema),
  (req, res, next) => reservationController.updateStatus(req, res, next)
);

// POS can fetch individual reservation for reconciliation.
router.get('/:id',
  (req, res, next) => reservationController.getById(req, res, next)
);

export default router;
