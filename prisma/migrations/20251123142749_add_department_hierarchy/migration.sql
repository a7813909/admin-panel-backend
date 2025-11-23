/*
  Warnings:

  - Added the required column `updatedAt` to the `Departament` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Departament" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Departament" ADD CONSTRAINT "Departament_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Departament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
