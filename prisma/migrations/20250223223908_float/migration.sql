/*
  Warnings:

  - Made the column `posicao` on table `oportunidades` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `oportunidades` MODIFY `posicao` DOUBLE NOT NULL DEFAULT 0;
