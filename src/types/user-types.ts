import { Prisma } from '@prisma/client';

// 1. Полный тип пользователя, генерируемый Prisma.
<<<<<<< HEAD
// Мы предполагаем, что у тебя установлен @prisma/client, чтобы это работало.
type FullUser = Prisma.UserGetPayload<{}>;

// 2. PublicUser: Тип, который мы отдаем наружу (без хеша пароля)
=======
type FullUser = Prisma.UserGetPayload<{}>;

// 2. PublicUser: Тип, который мы отдаем наружу (без хеша пароля)
// Omit - это TypeScript утилита, которая берёт тип FullUser и убирает из него указанные поля.
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
export type PublicUser = Omit<FullUser, 'password'>;


// 3. Тип для создания нового пользователя (Админом)
export type AdminCreateUserPayload = {
    email: string;
    password: string;
    name: string;
<<<<<<< HEAD
    // Используем тип роли напрямую из FullUser, чтобы не хардкодить
=======
    // Prisma ENUM Role должен быть доступен
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
    role: FullUser['role']; 
    departamentId?: string | null;
}

// 4. Тип для обновления пользователя (Админом)
<<<<<<< HEAD
export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>;
=======
export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>;
>>>>>>> e5f91cb0969aec08382bdff4169f263df4eeecd7
