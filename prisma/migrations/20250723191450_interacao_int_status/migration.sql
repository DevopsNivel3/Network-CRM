/*
  Warnings:

  - You are about to alter the column `tipo` on the `oportunidade_interacoes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - Made the column `status` on table `oportunidade_interacoes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `oportunidade_interacoes` MODIFY `tipo` INTEGER NOT NULL,
    MODIFY `status` INTEGER NOT NULL;
