import { Request } from 'express'; // Это важно для AuthRequest

export interface DecodedUser {
  // Это тип того, что В ТОКЕНЕ после декодирования
  // Убедись, что 'userId' соответствует тому, как ты сохраняешь ID в токене в auth.service.ts
  userId: string;
  email: string;
  role: string | string[]; // Может быть строкой или массивом, в зависимости от логики
  iat?: number;
  exp?: number;
}

export type CurrentUserDB = {
  // Это тип того, что ТЫ КЛАДЕШЬ В req.user ИЗ БАЗЫ ДАННЫХ
  id: string;
  email: string;
  role: string;
  // Если у тебя в req.user есть еще данные, например departmentId, добавь их сюда
  departamentId?: string; // Например, если привязан к req.user или null
  // ...
};

// Расширяем Request для использования req.user
export interface AuthRequest extends Request {
  user?: CurrentUserDB;
}