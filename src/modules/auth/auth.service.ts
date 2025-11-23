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
    name: string;
    departamentId: string; // <--- ДОБАВЛЯЕМ departamentId
}

// C. БЕЗОПАСНЫЙ ОТВЕТ КЛИЕНТУ (PublicUserView)
interface PublicUserView {
    id: string;
    email: string;
    role: string;
    name: string;
     departamentId: string; // <--- ДОБАВЛЯЕМ departamentId
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
       role?: 'USER' | 'EMPLOYEE' | 'ADMIN'; // Роль может быть опциональной в пейлоаде (человек сам ее не задает)
    departamentId: string; // ID департамента ОБЯЗАТЕЛЕН
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
         departamentId: user.departamentId,
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
                password: hashedPassword,
                name: data.name,
                role: data.role || 'USER', 
                departamentId: data.departamentId,
            },
            select: {
                id: true, email: true, role: true, name: true, departamentId: true,
            }
        }) as PublicUserView; 

        return newUser;
    } catch (error: any) { // Опять 'any', потому что TS не знает тип без 'instanceof'
        // !!! ВОТ ЗДЕСЬ ПРОСТО ПЕРЕБРАСЫВАЕМ ОШИБКУ КАК ЕСТЬ !!!
        // Контроллер поймает ее как PrismaClientKnownRequestError
        throw error; 
    }
};
