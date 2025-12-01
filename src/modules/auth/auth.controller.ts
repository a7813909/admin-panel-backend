import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { VALID_USER_ROLES } from '../../config/roles'; // <--- ИМПОРТИРУЕМ ЗДЕСЬ!
import { PrismaClient } from '@prisma/client'; // Импортируем PrismaClient
import bcrypt from 'bcryptjs'; // Импортируем bcryptjs
import { generateResetToken, verifyResetToken } from '../../utils/tokenUtils'; // Импортируем утилиты для токенов
import { forgotPasswordSchema, resetPasswordSchema } from '../../schemas/authSchemas'; // Импортируем Zod-схемы
// import { sendPasswordResetEmail } from '../../utils/emailService'; // Тебе нужно будет реализовать этот сервис

const prisma = new PrismaClient(); // Инициализируем PrismaClient

// ====================================================================
// ТВОИ УЖЕ СУЩЕСТВУЮЩИЕ ФУНКЦИИ
// ====================================================================
export const signUp = async (req: Request, res: Response) => {
    const { email, password, name, role, departamentId } = req.body;

    // !!! ИСПРАВЛЕННАЯ СИТАКСИЧЕСКИ ВАЛИДАЦИЯ !!!
    if (!email || !password || !name || !departamentId) { // Использовать || (ИЛИ), а не !
        return res.status(400).send({ message: 'Email, пароль, имя и ID департамента обязательны.' });
    }

    if (role && !VALID_USER_ROLES.includes(role as any)) {
      return res.status(400).send({ message: `Недопустимая роль: "${role}". Допустимые роли: ${VALID_USER_ROLES.join(', ')}.` });
    }
    // Здесь можно добавить валидацию departamentId на формат UUID, если есть util:
    // if (!isValidUUID(departamentId)) { /* ... */ }

    try {
        const newUser = await AuthService.registerNewUser({ email, password, name, role, departamentId });

        return res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: newUser
        });

    } catch (error: unknown) { // <--- ИЗМЕНЕНО НА 'unknown' для типобезопасности

        // Обработка специфических ошибок Prisma
        if (error instanceof PrismaClientKnownRequestError) {
             // 1. Ошибка уникальности email (P2002)
            if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('email')) {
                 return res.status(409).send({ message: `Пользователь с email "${email}" уже существует.` });
            }
            // 2. Ошибка внешнего ключа (departamentId не существует, P2003)
            if (error.code === 'P2003' && (error.meta as any)?.field_name === 'User_departamentId_fkey' ) { // Cast to any for field_name
                 return res.status(404).send({ message: `Департамент с ID "${departamentId}" не найден.` });
            }
            // Если это известная ошибка Prisma, но не P2002/P2003
            console.error('PrismaClientKnownRequestError - Unhandled:', error);
            return res.status(500).send({ message: 'Ошибка базы данных.', details: (error as Error).message }); // Cast to Error
        }

        // Если это другая, неизвестная ошибка (не Prisma ошибка)
        console.error('Неизвестная ошибка регистрации:', error);
        return res.status(500).send({ message: 'Ошибка сервера при регистрации.' });
    }
};

export const signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) { // Использовать || (ИЛИ), а не !
        return res.status(400).send({ message: 'Email и пароль обязательны' });
    }

    try {
        const userWithToken = await AuthService.signInAndGenerateToken(email, password);

        if (!userWithToken) {
            return res.status(401).send({ message: 'Неверные учетные данные' });
        }

        return res.status(200).json({
            message: 'Успешный вход',
            token: userWithToken.token,
            user: userWithToken.userView
        });

    } catch (error: unknown) { // <--- ИЗМЕНЕНО НА 'unknown'
        // Здесь можно добавить обработку ошибок аутентификации, например,
        // если сервис бросил ошибку, что пользователь не найден или пароль неверный
        console.error('Ошибка логина:', error);
        return res.status(500).send({ message: 'Внутренняя ошибка сервера при входе.' });
    }
};

// ====================================================================
// НОВЫЕ ФУНКЦИИ ДЛЯ СБРОСА ПАРОЛЯ
// ====================================================================

// 1. Запрос на сброс пароля (пользователь вводит email)
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body); // Валидация с Zod

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Важно: всегда отправляй одинаковый ответ, чтобы не давать информацию о существовании email
      return res.status(200).json({ message: 'Если аккаунт с этим email существует, ссылка для сброса пароля отправлена.' });
    }

    // Генерируем токен для сброса пароля
    const resetToken = generateResetToken(user.id, user.email);

    // [ВАЖНО]: Здесь должна быть реальная отправка email с resetToken
    // await sendPasswordResetEmail(user.email, resetToken);
    console.log(`[DEBUG] Password Reset Link for ${user.email}: /reset-password?token=${resetToken}`);

    return res.status(200).json({ message: 'Если аккаунт с этим email существует, ссылка для сброса пароля отправлена.' });
  } catch (error: any) { // Можно использовать 'any' для более простой обработки ошибок ZodError
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Ошибка запроса сброса пароля:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера при запросе сброса пароля.' });
  }
};

// 2. Сброс пароля (пользователь переходит по ссылке и вводит новый пароль)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body); // Валидация с Zod

    const decodedToken = verifyResetToken(token);

    if (!decodedToken) {
      return res.status(400).json({ message: 'Недействительный или просроченный токен сброса пароля.' });
    }

    // Проверяем, существует ли пользователь с таким userId (на всякий случай)
    const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 - количество раундов соли (salt rounds) для bcrypt

    // Обновляем пароль пользователя в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: 'Пароль успешно сброшен.' });
  } catch (error: any) { // Можно использовать 'any' для более простой обработки ошибок ZodError
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Ошибка сброса пароля:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера при сбросе пароля.' });
  }
};