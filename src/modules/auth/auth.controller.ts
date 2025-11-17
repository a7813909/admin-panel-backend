import { Request, Response } from 'express';
import * as AuthService from './auth.service'; 

// === УДАЛЕНЫ НЕНУЖНЫЕ ИМПОРТЫ: prisma, bcrypt, SALT_ROUNDS ===

/**
 * РЕГИСТРАЦИЯ. Вынесенная логика.
 */
export const signUp = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    // ИСПРАВЛЕН СИНТАКСИС: используем || (ИЛИ)
    if (!email || !password || !name) {
        return res.status(400).send({ message: 'Email, пароль и имя обязательны' });
    }

    try {
        // ВЕСЬ КУСОК ЛОГИКИ ПЕРЕНЕСЕН В СЕРВИС
        const newUser = await AuthService.registerNewUser({ email, password, name }); 

        // Если все прошло успешно
        return res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            // Возвращаем то, что вернул сервис
            user: newUser
        });

    } catch (error) {
        
        // Ловим ошибку, если пользователь уже существует (выброшенную сервисом)
        if (error instanceof Error && error.message.includes('уже существует')) {
             return res.status(400).send({ message: error.message });
        }
        
        // Внутренняя ошибка сервера
        console.error('Ошибка регистрации:', error);
        return res.status(500).send({ message: 'Внутренняя ошибка сервера' });
    }
};


/**
 * ЛОГИН. (Остался чистым)
 */
export const signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // ИСПРАВЛЕН СИНТАКСИС: используем || (ИЛИ)
    if (!email || !password) {
        return res.status(400).send({ message: 'Email и пароль обязательны' });
    }

    try {
        const userWithToken = await AuthService.signInAndGenerateToken(email, password);
        
        if (!userWithToken) {
            return res.status(401).send({ message: 'Неверные учетные данные' });
        }
        
        return res.status(200).json({
            message: 'Успешный вход',
            token: userWithToken.token,
            user: userWithToken.userView
        });

    } catch (error) {
        console.error('Ошибка логина:', error);
        return res.status(500).send({ message: 'Внутренняя ошибка сервера' });
    }
};