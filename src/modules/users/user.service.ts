import prisma from '../../db';
import * as bcrypt from 'bcryptjs';
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
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true },
  });
  return user as PublicUser | null;
};
// СОЗДАНИЕ (CREATE)
// =========================================================================

export const createAdminUser = async (data: AdminCreateUserPayload): Promise<PublicUser> => {
    
    // ... (проверка email)
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
        throw new Error('Пользователь с таким email уже существует.');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            departamentId: data.departamentId || null,
        },
        // SELECT должен соответствовать PublicUser!
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }
    });

    return newUser as PublicUser;
};
// ОБНОВЛЕНИЕ (UPDATE)
// =========================================================================

/**
 * Обновлениепользователя (только ADMIN может менять роль/отдел)
 */
export const updateAdminUser = async (id: string, data: AdminUpdateUserPayload): Promise<PublicUser> => {
    
    // Если в запросе передали новый пароль, хешируем его
    if (data.password) {
        data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    
    const updatedUser = await prisma.user.update({
        where: { id },
        data: data,
        // SELECT должен соответствовать PublicUser!
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, departamentId: true }

    });
    
    return updatedUser as PublicUser;
};
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
