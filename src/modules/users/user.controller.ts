import { Request, Response } from 'express';
// ⚠️ Предполагаю, что твой db.ts теперь экспортирует Prisma
import { Prisma } from '@prisma/client';
// Импортируем типы для req.body
import { AdminCreateUserPayload, AdminUpdateUserPayload } from '../../types/user-types';
// Импортируем все сервисы
import * as UserService from './user.service';

// ===================================
// 1. ЧТЕНИЕ ВСЕХ (READ ALL)
// ===================================
export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await UserService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        // Логирование error
        return res.status(500).json({ message: 'Ошибка сервера при получении списка пользователей.' });
    }
};

// ===================================
// 2. ЧТЕНИЕ ОДНОГО (READ ONE)
// ===================================
export const getUserDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await UserService.getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        // Логирование error
        return res.status(500).json({ message: 'Ошибка сервера при получении данных пользователя.' });
    }
};

// ===================================
// 3. СОЗДАНИЕ (CREATE)
// ===================================
export const createUserController = async (req: Request, res: Response) => {
    const userData: AdminCreateUserPayload = req.body;

    try {
        const newUser = await UserService.createAdminUser(userData);
        // 201 Created
        return res.status(201).json(newUser);

    } catch (error) {
        if (error instanceof Error) {
            // Если ошибка уникальности, которую кинул сервис
            if (error.message.includes('уже существует')) {
                return res.status(400).json({ message: error.message });
            }
        }
        // В остальных случаях
        return res.status(500).json({ message: 'Ошибка сервера при создании пользователя.' });
    }
};

// ===================================
// 4. ОБНОВЛЕНИЕ (UPDATE)
// ===================================
export const updateUserController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: AdminUpdateUserPayload = req.body;

    try {
        const updatedUser = await UserService.updateAdminUser(id, updateData);
        return res.status(200).json(updatedUser);
    } catch (error) {
        // Проверяем, что ошибка Призмы 
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: запись не найдена (кидается при update/delete/findUnique or Throw)
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Пользователь не найден для обновления.' });
            }
        }

        // Проверяем кастомные ошибки
        if (error instanceof Error) {
            // Если сервис кинул ошибку, что email занят другим юзером
            if (error.message.includes('уже используется')) {
                return res.status(400).json({ message: error.message });
            }
        }

        return res.status(500).json({ message: 'Ошибка сервера при обновлении пользователя.' });
    }
};

// ===================================
// 5. УДАЛЕНИЕ (DELETE)
// ===================================
export const deleteUserController = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const deletedUser = await UserService.deleteUser(id);
        // 200 OK, возвращаем удаленного пользователя
        return res.status(200).json(deletedUser);

    } catch (error) {
        // 🚨 ИСПРАВЛЕНА ЛИШНЯЯ СКОБКАnpm
        if (error instanceof Error) {
            // Если сервис кинул ошибку, что пользователь не найден
            if (error.message.includes('не найден')) {
                return res.status(404).json({ message: error.message });
            }
        }

        return res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.' });
    }
};