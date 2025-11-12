// src/app.ts
// Основной файл Express-приложения. Здесь настраиваются мидлвары, маршруты и обработка ошибок.
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; // Для базовой безопасности HTTP-заголовков
import cors from 'cors';     // Для управления доступом к API с разных доменов
import logger from './utils/logger'; // Наш кастомный логгер
import config from './config';     // Наш файл конфигурации
import prisma from './db';         // Наш экземпляр Prisma Client (если это рабочий импорт!)

// ===> НОВЫЙ ИМПОРТ: МОДУЛЬ АУТЕНТИФИКАЦИИ <===
import AuthRouter from './modules/auth/auth.router'; 
// ============================================

// Создаем экземпляр Express-приложения
const app = express();


// --- Базовые мидлвары для "корпоративного" приложения ---
// (ОСТАВЛЯЕМ ВСЕ ТВОИ КЛАССНЫЕ НАСТРОЙКИ)

app.use(helmet());

app.use(cors({
  origin: config.frontendCorsOrigins,
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// --- Мидлвар для логирования HTTP-запросов ---
app.use((req: Request, res: Response, next: NextFunction) => {
  // Немного подправил, чтобы избежать ошибок с обратными кавычками, но суть та же
  logger.http(`Received request: [${req.method}] ${req.url}`);
  next();
});

// --- Маршруты приложения ---


// Все запросы, начинающиеся с /auth, будут обрабатываться AuthRouter
app.use('/auth', AuthRouter);
// ===============================================

// Базовый маршрут для проверки работоспособности API
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to admin-panel-backend API! 🚀',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    corsOrigins: config.frontendCorsOrigins,
  });
});

// Тестовый маршрут для проверки подключения к базе данных через Prisma
app.get('/test-db', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ message: 'DB connection successful!', users });
        logger.info('Successfully fetched users from DB via /test-db endpoint');
    } catch (error) {
        logger.error('Failed to fetch users from DB via /test-db endpoint:', error);
        next(error);
    }
});

// --- Обработка ошибок (будет добавлена позже) ---
// ...

// Экспортируем Express-приложение для использования в server.ts
export default app;