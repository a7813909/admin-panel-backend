 import { z } from 'zod';

        export const forgotPasswordSchema = z.object({
          email: z.string().email('Invalid email address'),
        });

        export const resetPasswordSchema = z.object({
          token: z.string().min(1, 'Reset token is required'),
          newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
          // Можно добавить: .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        });