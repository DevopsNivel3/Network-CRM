/*
  Warnings:

  - Added the required column `hora_inicio` to the `visitas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `visitas` ADD COLUMN `hora_inicio` VARCHAR(191) NOT NULL;
