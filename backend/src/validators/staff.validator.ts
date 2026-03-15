import { z } from 'zod';

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(255),
  role: z.enum(['manager', 'host', 'viewer']),
});

export const updateStaffSchema = z.object({
  role: z.enum(['manager', 'host', 'viewer']).optional(),
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});
