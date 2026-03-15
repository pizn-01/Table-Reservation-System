import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { waitingListService } from '../services/waitingList.service';
import { WaitingListStatus } from '../types/enums';

const param = (req: AuthenticatedRequest, key: string): string => req.params[key] as string;

export class WaitingListController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const result = await waitingListService.list(param(req, 'orgId'), date);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async add(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await waitingListService.add(param(req, 'orgId'), req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const result = await waitingListService.updateStatus(
        param(req, 'id'),
        param(req, 'orgId'),
        status as WaitingListStatus
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await waitingListService.remove(param(req, 'id'), param(req, 'orgId'));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const waitingListController = new WaitingListController();
