/*
  Warnings:

  - Added the required column `atualizado` to the `oportunidade_comentarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oportunidade_comentarios` ADD COLUMN `atualizado` DATETIME(3) NOT NULL,
    ADD COLUMN `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
