import { z } from 'zod';

export const createWaitingListSchema = z.object({
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email().optional(),
  partySize: z.number().int().min(1).max(50),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  preferredArea: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateWaitingListStatusSchema = z.object({
  status: z.enum(['waiting', 'notified', 'seated', 'expired']),
});

export const updateCustomerProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
});
