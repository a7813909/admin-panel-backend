// src/modules/auth/auth.router.ts

import { Router } from 'express';
// Импортируем наш контроллер
import * as AuthController from './auth.controller';

const router = Router();

// POST /auth/signup - Регистрируем нового пользователя
router.post('/signup', AuthController.signUp);

// Здесь потом будет /login

export default router;