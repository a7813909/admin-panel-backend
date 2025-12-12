// В твоем types/user-types.ts

    import { Prisma } from '@prisma/client';

    // 1. Полный тип пользователя (базовый)
    type FullUserBase = Prisma.UserGetPayload<{}>;

    // 2. PublicUser: Тип, который мы отдаем наружу,
    //    теперь он будет включать название департамента
    export type PublicUser = Prisma.UserGetPayload<{
        // Select или Include здесь определяет, что будет в типе
        select: {
            id: true;
            email: true;
            name: true;
            role: true;
            active: true; // Если у тебя есть 'active'
            createdAt: true;
            updatedAt: true;
            departamentId: true; // Если ID департамента нужен
            departament: { // <--- ВОТ ЭТО МЫ ВКЛЮЧАЕМ В ТИП
                select: {
                    name: true;
                }
            };
        };
    }>;

    // Optional: Если тебе нужно сделать поля опциональными или изменить их для фронтенда
    // export type PublicUserForFront = Omit<PublicUser, 'departament'> & {
    //     departmentName: string; // Плоская версия для фронтенда (как мы обсуждали в Варианте 1)
    // };


    // 3. Тип для создания нового пользователя (Админом) - без изменений
    export type AdminCreateUserPayload = {
        email: string;
        password: string;
        name: string;
        role: FullUserBase['role']; // Используй базовый тип или 'Role' enum
        departamentId: string;
    }

    // 4. Тип для обновления пользователя (Админом) - без изменений
    export type AdminUpdateUserPayload = Partial<AdminCreateUserPayload>;