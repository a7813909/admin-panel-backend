// src/config/index.ts
export const JWT_SECRET = (process.env.JWT_SECRET || 'fallback_secret_if_not_set');
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as any; // Используем 'as any' для успокоения TS
// Этот файл загружает переменные окружения и предоставляет конфигурацию приложения.
import dotenv from 'dotenv';

dotenv.config(); // Загружаем переменные из .env файла

const config = {
  // Порт, на котором будет работать сервер
  port: process.env.PORT || 3000,

  // URL для подключения к базе данных PostgreSQL
  databaseUrl: process.env.DATABASE_URL || "",

  // Секретный ключ для подписи JWT токенов (ОЧЕНЬ ВАЖНО для безопасности!)
  jwtSecret: process.env.JWT_SECRET || "supersecretjwtkey",

  // Уровень логирования (info, debug, warn, error и т.д.)
  logLevel: process.env.LOG_LEVEL || "info",

  // Список разрешенных доменов для CORS (фронтенды, которые могут обращаться к бэкенду).
  // Если в .env несколько URL, они разделяются запятыми.
  frontendCorsOrigins: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',

  // Добавьте сюда другие конфигурационные параметры, если они понадобятся
};

// Проверка критически важных конфигураций
if (!config.databaseUrl) {
  console.error("⛔️ FATAL ERROR: DATABASE_URL is not defined in .env. Application cannot start.");
  process.exit(1); // Приложение не может работать без подключения к БД
}
if (config.jwtSecret === "supersecretjwtkey") {
  console.warn("⚠️ WARNING: JWT_SECRET is using a default insecure value. CHANGE IT IN .env FOR PRODUCTION!");
}

export default config;