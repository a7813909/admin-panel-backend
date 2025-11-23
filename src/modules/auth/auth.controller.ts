import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; 
 import { VALID_USER_ROLES } from '../../config/roles'; // <--- ИМПОРТИРУЕМ ЗДЕСЬ!

export const signUp = async (req: Request, res: Response) => {
    const { email, password, name, role, departamentId } = req.body;
    
    // !!! ИСПРАВЛЕННАЯ СИТАКСИЧЕСКИ ВАЛИДАЦИЯ !!!
    if (!email || !password || !name || !departamentId) { 
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
            if (error.code === 'P2003' && error.meta?.field_name === 'User_departamentId_fkey' ) { 
                 return res.status(404).send({ message: `Департамент с ID "${departamentId}" не найден.` });
            }
            // Если это известная ошибка Prisma, но не P2002/P2003
            console.error('PrismaClientKnownRequestError - Unhandled:', error);
            return res.status(500).send({ message: 'Ошибка базы данных.', details: error.message }); // error.message уже доступно, т.к. PrismaClientKnownRequestError
        }
        
        // Если это другая, неизвестная ошибка (не Prisma ошибка)
        console.error('Неизвестная ошибка регистрации:', error);
        return res.status(500).send({ message: 'Ошибка сервера при регистрации.' });
    }
};

export const signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
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