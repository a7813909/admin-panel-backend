import prisma from '../../db';

// [TYPE STUB] В идеале должен быть импорт из @types, но пока для TS-работы:
type PublicUser = { id: string; email: string; name: string | null; role: string; createdAt: Date; updatedAt: Date; };

export const getAllUsers = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  return users as PublicUser[];
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  return user;
};