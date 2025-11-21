import { Router } from 'express'; 
import * as UserController from './user.controller'; 
// Используем относительный путь для мидлваров:
import { protect, authorize } from '../../middlewares/auth.middleware'; 

const userRouter = Router();

// GET /users (READ ALL)
userRouter.get(
    '/', 
    protect, 
    authorize(['ADMIN']),
    UserController.listUsers
);
// 2. СОЗДАНИЕ (CREATE) -> POST /users
userRouter.post(
    '/', 
    protect, 
    authorize(['ADMIN']), 
    UserController.createUserController
);

// GET /users/:id (READ ONE)
userRouter.get(
    '/:id', 
    protect, 
    authorize(['ADMIN']), 
    UserController.getUserDetails
);

// PUT /users/:id (PUT ONE)
userRouter.put(
    '/:id', 
    protect, 
    authorize(['ADMIN']), 
    UserController.updateUserController
);

// DELETE /users/:id (DELETE ONE)
userRouter.delete(
    '/:id', 
    protect, 
    authorize(['ADMIN']), 
    UserController.deleteUserController
);

export default userRouter;