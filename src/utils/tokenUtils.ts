 import jwt from 'jsonwebtoken';

        // [ВАЖНО] Секрет для токенов сброса пароля. Должен быть в Environment Variables на Render!
        // Используй process.env.RESET_PASSWORD_SECRET, а не прямую строку для продакшена.
        // Fallback-значение 'fallback_reset_secret' только для локальной разработки и тестирования.
        const RESET_PASSWORD_SECRET = process.env.RESET_PASSWORD_SECRET || 'fallback_reset_secret_for_dev_only'; 

        // [ВАЖНО] Предупреждение о необходимости настройки RESET_PASSWORD_SECRET
        if (RESET_PASSWORD_SECRET === 'fallback_reset_secret_for_dev_only' && process.env.NODE_ENV !== 'production') {
          console.warn("⚠️ WARNING: RESET_PASSWORD_SECRET is using a fallback value. Set this in your environment variables for production!");
        } else if (RESET_PASSWORD_SECRET === 'fallback_reset_secret_for_dev_only' && process.env.NODE_ENV === 'production') {
          // Если ты видишь это предупреждение на продакшене, это критическая ошибка!
          console.error("❌ CRITICAL ERROR: RESET_PASSWORD_SECRET is not set in production environment variables!");
          throw new Error("RESET_PASSWORD_SECRET environment variable is missing in production.");
        }


        interface ResetTokenPayload {
          userId: string;
          email: string;
        }

        export const generateResetToken = (userId: string, email: string) => {
          if (!RESET_PASSWORD_SECRET) {
              throw new Error("RESET_PASSWORD_SECRET is not configured.");
          }
          return jwt.sign({ userId, email }, RESET_PASSWORD_SECRET, { expiresIn: '1h' }); // Токен действует 1 час
        };

        export const verifyResetToken = (token: string): ResetTokenPayload | null => {
          if (!RESET_PASSWORD_SECRET) {
              console.error("RESET_PASSWORD_SECRET is not configured, cannot verify token.");
              return null;
          }
          try {
            const decoded = jwt.verify(token, RESET_PASSWORD_SECRET) as ResetTokenPayload;
            return decoded;
          } catch (error) {
            console.error("Token verification failed:", error);
            return null; // Токен недействителен или просрочен
          }
        };