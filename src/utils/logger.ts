// src/utils/logger.ts
    // Настройка централизованного логирования с помощью Winston.
    import winston from 'winston';
    import config from '../config'; // Импортируем нашу конфигурацию для уровня логирования

    // Определяем уровни логирования и их порядок
    const levels = {
      error: 0,   // Самые критичные ошибки
      warn: 1,    // Предупреждения, которые могут привести к проблемам
      info: 2,    // Общая информация о работе приложения
      http: 3,    // Логирование HTTP-запросов
      debug: 4,   // Подробная информация для отладки
    };

    // Определяем цвета для каждого уровня (для вывода в консоль)
    const colors = {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      debug: 'white',
    };

    // Добавляем цвета в Winston
    winston.addColors(colors);

    // Определяем формат вывода логов
    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Добавляем метку времени
      winston.format.colorize({ all: true }),                     // Раскрашиваем весь вывод лога
      winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}` // Формат: [Время] УРОВЕНЬ: Сообщение
      )
    );

    // Определяем "транспорты" - куда будут выводиться логи
    const transports = [
      // Вывод в консоль с уровнем, указанным в конфиге (debug, info, warn, error)
      new winston.transports.Console({
        level: config.logLevel,
      }),
      // В "корпоративном" приложении тут часто добавляют другие транспорты:
      // - new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Логи ошибок в файл
      // - new winston.transports.File({ filename: 'logs/combined.log' }),             // Все логи в другой файл
      // - Или отправка логов во внешние системы (Sentry, Logstash, Splunk и т.д.)
    ];

    // Создаем экземпляр логгера
    const logger = winston.createLogger({
      levels,      // Используем наши определенные уровни
      format,      // Используем наш определенный формат
      transports,  // Используем наши определенные транспорты
    });

    export default logger;