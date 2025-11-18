/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'EMPLOYEE', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departamentId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Departament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Departament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "creatorId" TEXT,
    "assigneeId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departament_name_key" ON "Departament"("name");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departamentId_fkey" FOREIGN KEY ("departamentId") REFERENCES "Departament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
