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

// GET /users/:id (READ ONE)
userRouter.get(
    '/:id', 
    protect, 
    authorize(['ADMIN']), 
    UserController.getUserDetails
);

export default userRouter;