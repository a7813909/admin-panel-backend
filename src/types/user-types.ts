import { Prisma } from '@prisma/client';

// 1. Полный тип пользователя, генерируемый Prisma.
type FullUser = Prisma.UserGetPayload<{}>;

// 2. PublicUser: Тип, который мы отдаем наружу (без хеша пароля)
export type PublicUser = Omit<FullUser, 'password'>;


// 3. Тип для создания нового пользователя (Админом)
export type AdminCreateUserPayload = {
    email: string;
    password: string;
    name: string;
    role: FullUser['role']; 
    // 🚨 ИСПРАВЛЕНО: departamentId теперь ОБЯЗАТЕЛЕН
    departamentId: string; 
}

// 4. Тип для обновления пользователя (Админом)
export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>; 
// Partial делает все поля из AdminCreateUserPayload опциональными (что нужно для обновления)