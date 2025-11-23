import { Router } from 'express';
import { createDepartment } from './department.controller'; // Импортируем наш контроллер

const router = Router();

// POST / (например, если базовый путь '/departments', то это будет POST /departments)
// Создает новый департамент.
router.post('/', createDepartment);

// Здесь можно будет добавить другие роуты для департаментов, например:
// router.get('/', getDepartments); // Получить все департаменты
// router.get('/:id', getDepartmentById); // Получить департамент по ID
// router.put('/:id', updateDepartment); // Обновить департамент
// router.delete('/:id', deleteDepartment); // Удалить департамент

export default router;