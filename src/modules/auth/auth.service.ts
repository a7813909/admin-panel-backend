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
interface UserFromDB extends TokenPayload {
    password: string; 
    name: string | null; 
}

// C. БЕЗОПАСНЫЙ ОТВЕТ КЛИЕНТУ (PublicUserView)
interface PublicUserView {
    id: string;
    email: string;
    role: string;
    name: string | null;
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
    name: string; // Сделаем name обязательным при регистрации
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
    
    // Костыль для ТС. Утверждаем тип как string | number, чтобы избежать as any.
    const options: SignOptions = { 
        expiresIn: (config.jwtExpiresIn || '1h') as any
    };

    return jwt.sign(payload, config.jwtSecret, options);
};


/**
 * Обрабатывает логин, проверяет креды и генерирует токен.
 */
export const signInAndGenerateToken = async (email: string, password_in: string): Promise<UserAuthResult | null> => {

    // 1. Ищем пользователя. Кастуем к полному типу UserFromDB.
    const user = await prisma.user.findUnique({
        where: { email }
    }) as UserFromDB | null; 

    if (!user) {
        return null;
    }

    // 2. Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password_in, user.password);

    if (!isPasswordValid) {
        return null;
    }

    // 3. Генерируем токен. Передаем только минимальный пейлоад.
    const token = generateToken(user); 

    // 4. Формируем безопасный ответ для клиента
    const userView: PublicUserView = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name, // name теперь безопасно, так как есть в UserFromDB и PublicUserView
    };

    return { token, userView };
};


/**
 * Регистрирует нового пользователя. 
 */
export const registerNewUser = async (data: RegisterPayload): Promise<PublicUserView> => { 
   
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
        throw new Error('Пользователь с таким email уже существует.'); 
    }
    
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    // Создание пользователя
    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name, // Передаем name в базу
        },
        select: {
            id: true, email: true, role: true, name: true // Возвращаем все поля для PublicUserView
        }
    }) as PublicUserView; 

    return newUser;
};