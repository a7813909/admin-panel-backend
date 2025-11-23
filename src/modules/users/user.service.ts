import prisma from '../../db';
import * as bcrypt from 'bcryptjs';

import { 
    PublicUser, 
    AdminCreateUserPayload, 
    AdminUpdateUserPayload 
} from '../../types/user-types'; // Это правильный импорт типов

const SALT_ROUNDS = 10; 

// =========================================================================
// ЧТЕНИЕ (READ)
// =========================================================================

export const getAllUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  return users as PublicUser[]; 
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  return user as PublicUser | null;
};

// =========================================================================
// СОЗДАНИЕ (CREATE)
// =========================================================================

export const createAdminUser = async (data: AdminCreateUserPayload): Promise<PublicUser> => {
    
    // Проверка email (логика из твоего контроллера)
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
        throw new Error('Пользователь с таким email уже существует.');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            departamentId: data.departamentId,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });

    return newUser as PublicUser;
};

// =========================================================================
// ОБНОВЛЕНИЕ (UPDATE)
// =========================================================================

export const updateAdminUser = async (id: string, data: AdminUpdateUserPayload): Promise<PublicUser> => {
    
    // 🎯 ПРОВЕРКА УНИКАЛЬНОСТИ EMAIL ПЕРЕД ОБНОВЛЕНИЕМ
    if (data.email) {
        const userWithSameEmail = await prisma.user.findUnique({ 
            where: { email: data.email },
            select: { id: true } 
        });

        // Если найден пользователь с таким же email И этот пользователь НЕ ЕСТЬ ТЕКУЩИЙ ЮЗЕР (id != id)
        if (userWithSameEmail && userWithSameEmail.id !== id) {
            // 🚨 ИСПРАВЛЕНА СИНТАКСИЧЕСКАЯ ОШИБКА С КАВЫЧКАМИ
            throw new Error(`Email "${data.email}" уже используется другим пользователем.`);
        }
    }
    
    // Хеширование пароля и создание объекта для обновления
    const updateData: any = { ...data }; 

    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }
    
    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });
    
    return updatedUser as PublicUser;
};

// =========================================================================
// УДАЛЕНИЕ (DELETE)
// =========================================================================

export const deleteUser = async (userId: string): Promise<PublicUser> => {
    
    // 1. Проверка существования
    const userToDelete = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    
    if (!userToDelete) {
        throw new Error('Пользователь не найден.'); // Ошибку поймает контроллер как 404
    }
    
    // 2. ЦЕЛОСТНОСТЬ ДАННЫХ (Здесь должна быть логика очистки связей)

    // 3. ФАКТИЧЕСКОЕ УДАЛЕНИЕ
    const deletedUser = await prisma.user.delete({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });
    
    return deletedUser as PublicUser;
};