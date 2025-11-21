import { Prisma } from '@prisma/client';

// 1. Полный тип пользователя, генерируемый Prisma.
// Мы предполагаем, что у тебя установлен @prisma/client, чтобы это работало.
type FullUser = Prisma.UserGetPayload<{}>;

// 2. PublicUser: Тип, который мы отдаем наружу (без хеша пароля)
export type PublicUser = Omit<FullUser, 'password'>;


// 3. Тип для создания нового пользователя (Админом)
export type AdminCreateUserPayload = {
    email: string;
    password: string;
    name: string;
    // Используем тип роли напрямую из FullUser, чтобы не хардкодить
    role: FullUser['role']; 
    departamentId?: string | null;
}

// 4. Тип для обновления пользователя (Админом)
export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>;