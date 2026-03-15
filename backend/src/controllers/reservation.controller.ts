import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { reservationService } from '../services/reservation.service';

// Helper to safely extract string param from Express v5
const param = (req: AuthenticatedRequest, key: string): string => req.params[key] as string;

export class ReservationController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.list(param(req, 'orgId'), req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.getById(param(req, 'id'), param(req, 'orgId'));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.create(
        param(req, 'orgId'),
        req.body,
        req.user?.sub
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.update(param(req, 'id'), param(req, 'orgId'), req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, cancellationReason } = req.body;
      const result = await reservationService.updateStatus(
        param(req, 'id'),
        param(req, 'orgId'),
        status,
        req.user?.sub,
        cancellationReason
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body || {};
      const result = await reservationService.cancel(
        param(req, 'id'),
        param(req, 'orgId'),
        req.user?.sub,
        reason
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCalendarView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await reservationService.getCalendarView(param(req, 'orgId'), date);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const csv = await reservationService.exportCsv(param(req, 'orgId'), startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reservations-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const reservationController = new ReservationController();
