// Этот файл загружает переменные окружения и предоставляет конфигурацию приложения.
import * as dotenv from 'dotenv';

dotenv.config(); // Загружаем переменные из .env файла

//Создаем интерфейс, чтобы ТС знал структуру 
export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  logLevel: string;
  frontendCorsOrigins: string[]; // Так как мы будем делать split
}

const config: AppConfig = {
  // Порт, на котором будет работать сервер
  port: parseInt(process.env.PORT || '3000', 10),

  // URL для подключения к базе данных PostgreSQL
  databaseUrl: process.env.DATABASE_URL || "",

  // Секретный ключ для подписи JWT токенов (ОЧЕНЬ ВАЖНО для безопасности!)
  jwtSecret: process.env.JWT_SECRET || "ваьмваьмвжь=СекретнаяБелиберда=твмушрмцэ",

  //СРОК ГОДНОСТИ JWT
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  // Уровень логирования (info, debug, warn, error и т.д.)
  logLevel: process.env.LOG_LEVEL || "info",

  // Список разрешенных доменов для CORS (фронтенды, которые могут обращаться к бэкенду).
  frontendCorsOrigins: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : ['*'],

  };
// Проверка критически важных конфигураций
if (!config.databaseUrl) {
  console.error("⛔️ FATAL ERROR: DATABASE_URL is not defined in .env. Application cannot start.");
  process.exit(1); // Приложение не может работать без подключения к БД
}
if (config.jwtSecret === "ваьмваьмвжь=СекретнаяБелиберда=твмушрмцэ") {
  console.warn("⚠️ WARNING: JWT_SECRET is using a default insecure value. CHANGE IT IN .env FOR PRODUCTION!");
}

export default config;