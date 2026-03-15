import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { apiKeyService } from '../services/apiKey.service';

const param = (req: AuthenticatedRequest, key: string): string => req.params[key] as string;

export class ApiKeyController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await apiKeyService.list(param(req, 'orgId'));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const result = await apiKeyService.create(param(req, 'orgId'), name, req.user?.sub);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async revoke(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await apiKeyService.revoke(param(req, 'id'), param(req, 'orgId'), req.user?.sub);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const apiKeyController = new ApiKeyController();
