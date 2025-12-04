import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import prisma from '../../db';
import config from '../../config';

// === ТИПИЗАЦИЯ ===

// A. ПЕЙЛОАД ТОКЕНА (МИНИМАЛЬНЫЙ НАБОР ДАННЫХ ДЛЯ JWT)
interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

// B. ПОЛНЫЕ ДАННЫЕ ИЗ БАЗЫ (ВКЛЮЧАЯ ВСЕ, ЧТО НАМ НУЖНО)
interface UserFromDB { // Убрал extends TokenPayload, чтобы явно управлять полями
    id: string;
    email: string;
    role: string;
    password: string; // <-- ИСПРАВЛЕНО: passwordHash, а не password
    name: string;
    departamentId?: string; // <= Сделал опциональным, как на фронтенде
    createdAt: Date;
    updatedAt: Date;
}

// C. БЕЗОПАСНЫЙ ОТВЕТ КЛИЕНТУ (PublicUserView)
export interface PublicUserView { // <-- ДОБАВИЛ `export` т.к. может понадобится другим файлам
    id: string;
    email: string;
    role: string;
    name: string;
    departamentId?: string; // <= Сделал опциональным
    createdAt: Date;
    updatedAt: Date;
}

// D. РЕЗУЛЬТАТ СЕРВИСА (ВОЗВРАЩАЕТСЯ КОНТРОЛЛЕРУ)
interface UserAuthResult {
    token: string;
    userView: PublicUserView;
}

// E. Входящие данные для регистрации
interface RegisterPayload {
    email: string;
    password: string;
    name: string;
    role?: 'USER' | 'EMPLOYEE' | 'ADMIN';
    departamentId?: string; // <= Сделал опциональным
}

const SALT_ROUNDS: number = 10;

/**
 * Генерирует и подписывает JWT токен.
 */
export const generateToken = (user: TokenPayload): string => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const options: SignOptions = {
        expiresIn: (config.jwtExpiresIn || '1h') as any // <--- Утверждаем как string
    };

    return jwt.sign(payload, config.jwtSecret, options);
};


/**
 * Обрабатывает логин, проверяет креды и генерирует токен.
 */
export const signInAndGenerateToken = async (email: string, password_in: string): Promise<UserAuthResult | null> => {

    // 1. Ищем пользователя С ЯВНЫМ ВЫБОРОМ ВСЕХ НУЖНЫХ ПОЛЕЙ
    const user = await prisma.user.findUnique({
        where: { email },
        select: { // <--- ВОТ ЭТО БЫЛО УПУЩЕНО В ЭТОЙ ФУНКЦИИ!
            id: true,
            email: true,
            password: true, // Нужно для проверки пароля
            name: true,
            role: true,
            departamentId: true,
            createdAt: true, // <--- ДОБАВЛЕНО
            updatedAt: true, // <--- ДОБАВЛЕНО
        }
    });

    if (!user) { // Если пользователь не найден
        return null;
    }

    // 2. Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password_in, user.password); // <--- ИСПОЛЬЗУЕМ passwordHash

    if (!isPasswordValid) {
        return null;
    }

    // 3. Генерируем токен. Передаем только минимальный пейлоад.
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    // 4. Формируем безопасный ответ для клиента
    const userView: PublicUserView = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        departamentId: user.departamentId,
        createdAt: user.createdAt, // <--- ТЕПЕРЬ ОНО ЗДЕСЬ ПОЯВИТСЯ
        updatedAt: user.updatedAt, // <--- ТЕПЕРЬ ОНО ЗДЕСЬ ПОЯВИТСЯ
    };

    return { token, userView };
};


/**
 * Регистрирует нового пользователя.
 */
export const registerNewUser = async (data: RegisterPayload): Promise<PublicUserView> => {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    try {
        const newUser = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword, // <--- ИСПОЛЬЗУЕМ passwordHash (как в schema.prisma)
                name: data.name,
                role: data.role || 'USER',
                departamentId: data.departamentId, // Если departamentId опционален, добавить || null
            },
            select: { // <--- ДОБАВЛЕНЫ createdAt и updatedAt ЗДЕСЬ
                id: true, email: true, role: true, name: true, departamentId: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Prisma.UserCreateInput не гарантирует PublicUserView,
        // поэтому копируем поля явно или создаем более точный тип.
        const returnedUser: PublicUserView = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
            departamentId: newUser.departamentId,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        }

        return returnedUser;

    } catch (error: any) {
        throw error;
    }
};