import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { dashboardService } from '../services/dashboard.service';

const param = (req: AuthenticatedRequest, key: string): string => req.params[key] as string;

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getStats(param(req, 'orgId'));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTrend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getWeeklyTrend(param(req, 'orgId'));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
