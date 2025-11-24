import { Router } from 'express';
import * as UserController from './user.controller';
// Используем относительный путь для мидлваров:
import { protect, authorize } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client'

const userRouter = Router();

// Роуты для коллекции (без ID)
userRouter.route('/')
    .get(protect, authorize([Role.ADMIN]), UserController.listUsers)    // GET /users
    .post(protect, authorize([Role.ADMIN]), UserController.createUserController); // POST /users

// Роуты для индивидуальной сущности (с ID)
userRouter.route('/:id')
    .get(protect, authorize([Role.ADMIN]), UserController.getUserDetails)  // GET /users/:id
    .put(protect, authorize([Role.ADMIN]), UserController.updateUserController) // PUT /users/:id
    .delete(protect, authorize([Role.ADMIN]), UserController.deleteUserController); // DELETE /users/:id


export default userRouter;