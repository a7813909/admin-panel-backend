import { Request, Response } from 'express';
import * as UserService from './user.service'; 

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await UserService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Ошибка сервера.' });
    }
};

export const getUserDetails = async (req: Request, res: Response) => {
    const { id } = req.params; 
    try {
        const user = await UserService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Ошибка сервера.' });
    }
};
