import { Router, Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { reservationService } from '../services/reservation.service';
import { validate } from '../middleware/validator';
import { createReservationSchema } from '../validators/reservation.validator';
import { publicApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting for public unauthenticated endpoints
router.use(publicApiLimiter);

// Helper to safely extract string param from Express v5
const param = (req: Request, key: string): string => req.params[key] as string;

/**
 * Public endpoints for restaurant website widgets and POS.
 * Authenticated via restaurant slug (public info only).
 */

// GET /public/:slug/info — Get restaurant public info
router.get('/:slug/info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.getBySlug(param(req, 'slug'));

    // Return only public-safe fields
    res.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        address: org.address,
        phone: org.phone,
        openingTime: org.openingTime,
        closingTime: org.closingTime,
        maxPartySize: org.maxPartySize,
        allowWalkIns: org.allowWalkIns,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /public/:slug/availability — Check table availability
router.get('/:slug/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.getBySlug(param(req, 'slug'));
    const date = req.query.date as string;
    const time = req.query.time as string;
    const partySize = req.query.partySize as string;

    if (!date || !time || !partySize) {
      res.status(400).json({
        success: false,
        error: 'date, time, and partySize query parameters are required',
      });
      return;
    }

    const available = await reservationService.getAvailableTables(
      org.id,
      date,
      time,
      parseInt(partySize, 10)
    );

    res.json({ success: true, data: available });
  } catch (error) {
    next(error);
  }
});

// POST /public/:slug/reserve — Make a reservation (guest)
router.post('/:slug/reserve',
  validate(createReservationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await organizationService.getBySlug(param(req, 'slug'));

      const result = await reservationService.create(org.id, {
        ...req.body,
        source: 'website',
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
