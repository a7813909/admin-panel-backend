import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// --- НОВЫЕ ИМПОРТЫ ---
import prisma from '../db'; // ⚠️ Импортируем клиент Prisma
import { Prisma } from '@prisma/client'; // Импортируем типы Prisma
// ----------------------
import config from '../config';

// --- 1. ТИПИЗАЦИЯ ---

// ... (DecodedUser остается, но она теперь для ПРОВЕРКИ ТОКЕНА, а не для req.user)

// Тип пользователя, как его возвращает findUnique (для req.user)
type CurrentUserDB = {
  id: string;
  email: string;
  role: string;
};

// Расширяем Request для TS, чтобы добавить req.user. Теперь он из БД.
export interface AuthRequest extends Request {
  user?: CurrentUserDB;
}

const JWT_SECRET = config.jwtSecret;

// ----------------------------------------------------------------------
// --- 2. MIDDLEWARE: ЗАЩИТА (ПРОВЕРКА JWT И БД) ---
// ----------------------------------------------------------------------

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => { // 🚨 СТАЛ АСИНХРОННЫМ
  let token: string = '';
  let decoded: DecodedUser;

  // 1. Проверяем заголовок
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 2. Верифицируем токен
      decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;

    } catch (error) {
       // Ошибка токена (просрочен, невалиден)
       console.error('JWT Verification Failed:', error);
       return res.status(401).json({
         message: 'Не авторизован. Токен недействителен или просрочен.',
       });
    }
  } else {
    // Токен отсутствует
    return res.status(401).json({
      message: 'Не авторизован. Токен аутентификации отсутствует.'
    });
  }


  // 🚨 КРИТИЧНЫЙ ШАГ: ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ И ЕГО АКТУАЛЬНОЙ РОЛИ
  try {
     const currentUserFromDb = await prisma.user.findUnique({
         where: { id: decoded.userId }, // ID берем из токена
         select: { id: true, email: true, role: true } // Берем только нужные актуальные поля
     });

     if (!currentUserFromDb) {
         // Юзер найден в токене, но удален из БД ("Зомби-токен")
         return res.status(401).json({ message: 'Не авторизован. Учетная запись неактивна или удалена.' });
     }
     
     // 3. 🎯 Если успешно, прикрепляем АКТУАЛЬНЫЕ данные из БД к запросу
     // (Это важно, если роль юзера изменилась с USER на ADMIN, например)
     req.user = currentUserFromDb;

     next();

  } catch (error) {
      // Ошибка БД (500)
      console.error('Database check failed during protection:', error);
      return res.status(500).json({ message: 'Ошибка сервера при проверке аутентификации.' });
  }
};

// ----------------------------------------------------------------------
// --- 3. MIDDLEWARE: АВТОРИЗАЦИЯ (ПРОВЕРКА РОЛИ) ---
// ----------------------------------------------------------------------

export const authorize = (roles: string[]) => {

  return (req: AuthRequest, res: Response, next: NextFunction) => {

    // ... (логика authorize остается)

    // ИСПРАВЛЕНИЕ СИНТАКСИСА ШАБЛОННОЙ СТРОКИ:
    return res.status(403).json({
        message: `Доступ запрещен. Требуются роли: ${roles.join(', ')}.`
    });
  };
};