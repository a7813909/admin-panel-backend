 // src/db/index.ts
    // Инициализация Prisma Client и настройка его логирования.
    import { PrismaClient } from '@prisma/client';
    import logger from '../utils/logger'; // Импортируем наш логгер

    // Создаем экземпляр Prisma Client
    const prisma = new PrismaClient({
      // Настраиваем логирование запросов Prisma для отладки
      log: [
        { emit: 'event', level: 'query' }, // Логировать все SQL-запросы
        { emit: 'event', level: 'error' }, // Логировать ошибки Prisma
        { emit: 'event', level: 'info' },  // Логировать информационные сообщения Prisma
        { emit: 'event', level: 'warn' },  // Логировать предупреждения Prisma
      ],
    });

    // Связываем логи Prisma с нашим кастомным логгером Winston
    prisma.$on('query', (e) => {
      logger.debug(`[Prisma Query] ${e.query} Params: ${e.params} Duration: ${e.duration}ms`);
    });
    prisma.$on('error', (e) => {
      logger.error(`[Prisma Error] Message: ${e.message} Target: ${e.target}`);
    });
    prisma.$on('info', (e) => {
      logger.info(`[Prisma Info] Message: ${e.message} Target: ${e.target}`);
    });
    prisma.$on('warn', (e) => {
      logger.warn(`[Prisma Warn] Message: ${e.message} Target: ${e.target}`);
    });

    // Экспортируем экземпляр Prisma Client для использования в других частях приложения
    export default prisma;