import prisma from '../../db';
import * as bcrypt from 'bcryptjs';
<<<<<<< HEAD

import { 
    PublicUser, 
    AdminCreateUserPayload, 
    AdminUpdateUserPayload 
} from '../../types/user-types'; 

const SALT_ROUNDS = 10; 

// ===================================
// ЧТЕНИЕ (READ)
// ===================================
// ... (оставим Read-функции без изменений)

export const getAllUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    // SELECT должен соответствовать PublicUser!
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  return users as PublicUser[]; 
=======
// 🎯 Импортируем типы из нашего нового файла
import { PublicUser, AdminCreateUserPayload, AdminUpdateUserPayload } from '../../types/user-types'; 

const SALT_ROUNDS = 10; 
// TODO: Импортировать Role ENUM из генерируемых типов.

// =========================================================================
// ЧТЕНИЕ (READ)
// =========================================================================

export const getAllUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    // Используем SELECT, чтобы Prisma знал, какие поля брать, и чтобы ТС не ругался
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  // ТС автоматически выводит тип PublicUser[] на основе SELECT^
  return users as PublicUser[]; // Можно оставить as PublicUser[] для явности/страховки
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  return user as PublicUser | null;
};
<<<<<<< HEAD
// ===================================
// СОЗДАНИЕ (CREATE)
// ===================================
export const createAdminUser = async (data: AdminCreateUserPayload): Promise<PublicUser> => {
    
    // Проверка email (логика из твоего контроллера)
=======
// СОЗДАНИЕ (CREATE)
// =========================================================================

export const createAdminUser = async (data: AdminCreateUserPayload): Promise<PublicUser> => {
    
    // ... (проверка email)
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
        throw new Error('Пользователь с таким email уже существует.');
    }

<<<<<<< HEAD
=======
    // Хешируем пароль
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            departamentId: data.departamentId || null,
        },
<<<<<<< HEAD
=======
        // SELECT должен соответствовать PublicUser!
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });

    return newUser as PublicUser;
};
<<<<<<< HEAD

// ===================================
// ОБНОВЛЕНИЕ (UPDATE) <<< ИСПРАВЛЕНО
// ===================================
export const updateAdminUser = async (id: string, data: AdminUpdateUserPayload): Promise<PublicUser> => {
    
    // 🎯 ПРОВЕРКА УНИКАЛЬНОСТИ EMAIL ПЕРЕД ОБНОВЛЕНИЕМ
    if (data.email) {
        const userWithSameEmail = await prisma.user.findUnique({ 
            where: { email: data.email },
            select: { id: true } // Достаточно ID для проверки
        });

        // Если найден пользователь с таким же email И этот пользователь НЕ ЕСТЬ ТЕКУЩИЙ ЮЗЕР (id != id)
        if (userWithSameEmail && userWithSameEmail.id !== id) {
            throw new Error(`Email "${data.email}" уже используется другим пользователем.`);
        }
    }
    
    // Хеширование пароля и создание объекта для обновления
    const updateData: any = { ...data }; 

    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
=======
// ОБНОВЛЕНИЕ (UPDATE)
// =========================================================================

/**
 * Обновлениепользователя (только ADMIN может менять роль/отдел)
 */
export const updateAdminUser = async (id: string, data: AdminUpdateUserPayload): Promise<PublicUser> => {
    
    // Если в запросе передали новый пароль, хешируем его
    if (data.password) {
        data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
    }
    
    const updatedUser = await prisma.user.update({
        where: { id },
<<<<<<< HEAD
        data: updateData,
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
=======
        data: data,
        // SELECT должен соответствовать PublicUser!
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }

>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
    });
    
    return updatedUser as PublicUser;
};
<<<<<<< HEAD


// =========================================================================
// УДАЛЕНИЕ (DELETE)
// =========================================================================

export const deleteUser = async (userId: string): Promise<PublicUser> => {
    
    // 1. Проверка существования
    const userToDelete = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    
    if (!userToDelete) {
        throw new Error('Пользователь не найден.'); // Ошибку поймает контроллер как 404
    }
    
    // 2. ЦЕЛОСТНОСТЬ ДАННЫХ (УДАЛЕНА КОММЕНТАРИЯМИ)

    // 3. ФАКТИЧЕСКОЕ УДАЛЕНИЕ
    const deletedUser = await prisma.user.delete({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });
    return deletedUser as PublicUser;
};
=======
// УДАЛЕНИЕ (DELETE)
// =========================================================================

/**
 * Удаляет пользователя по ID, обеспечивая целостность данных.
 * ПРИМЕЧАНИЕ: Обнуление ownerId/creatorId в задачах/контактах предотвращает потерю истории.
 */
export const deleteUser = async (userId: string): Promise<void> => {
    
    // 1. Проверяем, существует ли пользователь, которого удаляем
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!userToDelete) {
        throw new Error('Пользователь не найден.');
    }
    
    // 2. ОБЕСПЕЧЕНИЕ ЦЕЛОСТНОСТИ ДАННЫХ
    // ------------------------------------
    // Все, что создал или за что отвечал пользователь, отвязываем от его ID.
    // Если ownerId/creatorId обязательны, то здесь надо назначать их на 'BOT_ID'.
    // Мы предполагаем, что поля владельца в Task/Contact/Group разрешают NULL (String?).

    const ownerIdNullOption = null; 

    // Обнуляем владельца в созданных задачах (Task.creatorId)
    await prisma.task.updateMany({ 
        where: { creatorId: userId },
        data: { creatorId: ownerIdNullOption }
    });
    
    // Обнуляем ответственного в назначенных задачах (Task.assigneeId)
    await prisma.task.updateMany({ 
        where: { assigneeId: userId },
        data: { assigneeId: ownerIdNullOption }
    });
    
    // ... То же самое нужно сделать для Contact (ownerId) и Group (teacherId)

    // ------------------------------------
    
    // 3. УДАЛЕНИЕ САМОЙ СУЩНОСТИ
    await prisma.user.delete({ where: { id: userId } });
    
    // Возвращаем void, так как 204 No Content не предполагает тела ответа
};
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
