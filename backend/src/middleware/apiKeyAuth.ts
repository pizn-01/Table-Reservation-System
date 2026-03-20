import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { apiKeyService } from '../services/apiKey.service';

/**
 * Authenticate external POS calls using X-API-Key.
 * Also enforces :orgId ownership for multi-tenant safety.
 */
export const authenticateApiKeyForRestaurant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const rawApiKey = req.header('X-API-Key');
  if (!rawApiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required. Provide X-API-Key header.',
    });
    return;
  }

  const validated = await apiKeyService.validate(rawApiKey);
  if (!validated) {
    res.status(401).json({
      success: false,
      error: 'Invalid or inactive API key.',
    });
    return;
  }

  const orgId = req.params.orgId as string;
  if (!orgId) {
    res.status(400).json({
      success: false,
      error: 'Organization ID is required.',
    });
    return;
  }

  if (validated.restaurantId !== orgId) {
    res.status(403).json({
      success: false,
      error: 'API key does not have access to this restaurant.',
    });
    return;
  }

  req.restaurantId = orgId;
  next();
};
