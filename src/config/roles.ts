 import { Role } from '@prisma/client'; // Импортируем ENUM из сгенерированного Prisma Client

    // Получаем все возможные значения ENUM Role как массив строк
    export const VALID_USER_ROLES: Role[] = Object.values(Role);

    // Пример использования для строки:
    // export const VALID_USER_ROLE_STRINGS: string[] = Object.values(Role); // Если нужен массив именно строк
    // или более специфично
    // export const VALID_USER_ROLE_STRINGS: ('USER' | 'EMPLOYEE' | 'ADMIN')[] = [Role.USER, Role.EMPLOYEE, Role.ADMIN];

    // Примеры других констант:
    // export const DEFAULT_SALT_ROUNDS: number = 10;
    // export const DEFAULT_USER_ROLE: Role = Role.USER;