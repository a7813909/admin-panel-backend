import prisma from '../../db'; // Важно: импортируем твой синглтон Prisma Client

// Тип для входящих данных при создании департамента.
// parentId может быть string (если есть родитель) или null/undefined (для корневого департамента).
interface CreateDepartmentData {
  name: string;
  parentId?: string | null; // Делаем parentId необязательным и разрешаем null
}

/**
 * Создает новый департамент в базе данных.
 * @param data Объект с именем департамента и опциональным ID родительского департамента.
 * @returns Созданный объект департамента, включая его ID.
 */
export const createDepartment = async (data: CreateDepartmentData) => {
  // Prisma автоматически сгенерирует id и проставит createdAt/updatedAt
  const department = await prisma.departament.create({
    data: {
      name: data.name,
      // parentId передается, только если он есть и не null.
      // Prisma сама справится с null, если parentId будет отсутствовать в data
      // Если же parentId будет явно null, Prisma также его корректно обработает
      parentId: data.parentId,
    },
  });
  return department;
};

// Здесь могут быть другие функции для работы с департаментами (получить, обновить, удалить и т.д.)
// Пример:
// export const getDepartments = async () => {
//   return prisma.departament.findMany({
//     include: {
//       subDepartments: true, // Включаем дочерние департаменты, если нужно
//       parent: true,        // Включаем родительский департамент
//     },
//   });
// };