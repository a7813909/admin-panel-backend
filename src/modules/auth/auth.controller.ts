// src/modules/auth/auth.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
//import * as jwt from 'jsonwebtoken';
import jwt, { SignOptions } from 'jsonwebtoken'; 
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../config/index'

// === ВНИМАНИЕ НА ЭТУ СТРОКУ ===
// Используем дефолтный импорт (без {}), потому что в src/db/index.ts, скорее всего, стоит export default prisma;
import prisma from '../../db';
// Если у тебя в db/index.ts экспорт именованный (export const prisma), то поменяй на:
// import { prisma } from '../../db';

const SALT_ROUNDS : number = 10;


/**
 * @route POST /auth/signup
 * @desc Регистрирует нового пользователя.
 */
export const signUp = async (req: Request, res: Response) => {
    // ... (весь код функции, который я давал ранее) ...

    const { email, password, name } = req.body;
   

    if (!email || !password) {
        return res.status(400).send({ message: 'Email и пароль обязательны' });
    }

    try {
        const userExists = await prisma.user.findUnique({ where: { email } });

        if (userExists) {
            return res.status(400).send({ message: 'Пользователь с таким email уже существует.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        return res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: newUser
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return res.status(500).send({ message: 'Внутренняя ошибка сервера' });
    }
};

/**
 * @route POST /auth/login
 * @desc Аутентифицирует пользователя и возвращает JWT токен.
 */
export const signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email и пароль обязательны' });
    }

    try {
        // 1. Ищем пользователя по email (Prisma)
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Аутентификационная ошибка, чтобы не выдавать, существует ли email
            return res.status(401).send({ message: 'Неверные учетные данные' });
        }

        // 2. Сравниваем введенный пароль с хешем из БД (bcrypt)
        // user.password - это хеш, который мы сохранили
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send({ message: 'Неверные учетные данные' });
        }

// 1. Создаем Payload и приводим его к общему типу 'object'
const payload = { userId: user.id, role: user.role } as object;

// 2. Определяем опции с явным типом
const options: SignOptions = { 
    expiresIn: JWT_EXPIRES_IN 
};

// 3. Вызываем jwt.sign
const token = jwt.sign(
    payload, // Теперь это чистый object
    JWT_SECRET,
    options // Теперь это явно SignOptions
);

        
        // 4. Отправляем ответ с токеном
        return res.status(200).json({
            message: 'Успешный вход',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role // Полезно для фронтенда
            }
        });

    } catch (error) {
        console.error('Ошибка логина:', error);
        return res.status(500).send({ message: 'Внутренняя ошибка сервера' });
    }
};