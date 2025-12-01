// src/modules/auth/auth.router.ts

import { Router } from 'express'; 
// Импортируем наш контроллер
import * as AuthController from './auth.controller';

const router = Router(); 

// POST /auth/signup - Регистрируем нового пользователя
router.post('/signup', AuthController.signUp);
 
// POST /auth/login - Аутентифицируем и выдаем токен
router.post('/login', AuthController.signIn);

//сброс пароля (по email)
router.post('/forgot-password', AuthController.requestPasswordReset);

// POST /auth/reset-password - Сброс пароля (с токеном и новым паролем)
router.post('/reset-password', AuthController.resetPassword);

export default router;