 import { Router } from 'express';
    // !!!!!!!!!!!!!! АВТОМАТИЧЕСКИЙ ИМПОРТ ИСПРАВЛЕН !!!!!!!!!!!!!!!!!!!!!!!!
    import { createDepartment, getDepartments } from './department.controller'; 

    const router = Router();

    // Маршрут для создания департамента (POST)
    router.post('/', createDepartment);

    // !!! ВОТ ЭТОТ МАРШРУТ ТЕПЕРЬ АКТИВЕН И БУДЕТ ОБСЛУЖИВАТЬ ФРОНТЕНД !!!
    router.get('/', getDepartments); 

    export default router;