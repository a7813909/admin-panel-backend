import { Request, Response, NextFunction } from 'express'; // Добавлен NextFunction
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as departmentService from './department.service'; // Импортируем весь сервис


/**
 * Обрабатывает POST-запрос для создания нового департамента.
 * Ожидает в теле запроса { "name": "Название Отдела", "parentId": "id_родителя" (опционально) }.
 */
export const createDepartment = async (req: Request, res: Response, next: NextFunction) => { // Добавлен next для единообразия
  const { name, parentId } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') { // Исправлен оператор ||
    return res.status(400).json({ error: 'Department name is required and must be a non-empty string.' });
  }

  if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Parent ID must be a string (UUID) or null if provided.' });
  }

  try {
    const department = await departmentService.createDepartment({ name, parentId });
    res.status(201).json(department);
  } catch (error: any) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('name')) {
        return res.status(409).json({ error: `Department with name "${name}" already exists.` }); // Исправлен синтаксис для интерполяции
      }
      if (error.code === 'P2003' && error.meta?.field_name === 'Departament_parentId_fkey (index)') {
        return res.status(404).json({ error: `Parent department with ID "${parentId}" not found.` }); // Исправлен синтаксис для интерполяции
      }
      console.error('PrismaClientKnownRequestError:', error);
      return res.status(500).json({ error: 'Database operation failed.', details: error.message });
    }
    console.error('Unknown error in createDepartment controller:', error);
    res.status(500).json({ error: 'Failed to create department due to server error.' });
  }
};


// !!! ВОТ ЭТА ФУНКЦИЯ КОНТРОЛЛЕРА ТЕБЕ НУЖНА ДЛЯ ОБРАБОТКИ GET-ЗАПРОСА С ФРОНТЕНДА !!!
/**
 * Обрабатывает GET-запрос для получения списка всех департаментов.
 * @returns Массив объектов департаментов.
 */
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await departmentService.getDepartments(); // Вызываем функцию из сервиса
    res.status(200).json(departments); // Отправляем список в формате JSON
  } catch (error) {
    // В случае ошибки логируем ее и передаем дальше в глобальный обработчик ошибок Express
    console.error('Error in getDepartments controller:', error);
    next(error); // Очень важно передать ошибку дальше
  }
};