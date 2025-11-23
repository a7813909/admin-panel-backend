

import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as departmentService from './department.service'; // Импортируем наш сервис

/**
 * Обрабатывает POST-запрос для создания нового департамента.
 * Ожидает в теле запроса { "name": "Название Отдела", "parentId": "id_родителя" (опционально) }.
 */
export const createDepartment = async (req: Request, res: Response) => {
  const { name, parentId } = req.body; // Получаем name и parentId из тела запроса

  // Базовая валидация имени
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Department name is required and must be a non-empty string.' });
  }

  // Валидация parentId, если он был передан
  if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
    // parentId может быть undefined (не передан), null (явный NULL) или string (UUID)
    // Если он есть, но не string и не null, то это некорректно.
    return res.status(400).json({ error: 'Parent ID must be a string (UUID) or null if provided.' });
  }

 try {
      const department = await departmentService.createDepartment({ name, parentId });
      res.status(201).json(department);
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('name')) {
              return res.status(409).json({ error: `Department with name "${name}" already exists.` });
          }
          if (error.code === 'P2003' && error.meta?.field_name === 'Departament_parentId_fkey (index)') {
              return res.status(404).json({ error: `Parent department with ID "${parentId}" not found.` });
          }
          console.error('PrismaClientKnownRequestError:', error);
          return res.status(500).json({ error: 'Database operation failed.', details: error.message });
      }
      console.error('Unknown error in createDepartment controller:', error);
      res.status(500).json({ error: 'Failed to create department due to server error.' });
    }
}