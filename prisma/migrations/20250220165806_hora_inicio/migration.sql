/*
  Warnings:

  - You are about to alter the column `hora_inicio` on the `visitas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `visitas` MODIFY `hora_inicio` DATETIME(3) NOT NULL;
