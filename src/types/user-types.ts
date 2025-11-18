import { Prisma } from '@prisma/client';

// 1. Полный тип пользователя, генерируемый Prisma.
type FullUser = Prisma.UserGetPayload<{}>;

// 2. PublicUser: Тип, который мы отдаем наружу (без хеша пароля)
// Omit - это TypeScript утилита, которая берёт тип FullUser и убирает из него указанные поля.
export type PublicUser = Omit<FullUser, 'password'>;


// 3. Тип для создания нового пользователя (Админом)
export type AdminCreateUserPayload = {
    email: string;
    password: string;
    name: string;
    // Prisma ENUM Role должен быть доступен
    role: FullUser['role']; 
    departamentId?: string | null;
}

// 4. Тип для обновления пользователя (Админом)
export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>;
