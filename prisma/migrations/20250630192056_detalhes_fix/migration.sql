/*
  Warnings:

  - A unique constraint covering the columns `[oportunidade_id]` on the table `oportunidade_detalhes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[detalhes_id]` on the table `oportunidades` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `oportunidade_detalhes` DROP FOREIGN KEY `oportunidade_detalhes_oportunidade_id_fkey`;

-- DropIndex
DROP INDEX `oportunidade_detalhes_oportunidade_id_fkey` ON `oportunidade_detalhes`;

-- AlterTable
ALTER TABLE `oportunidades` ADD COLUMN `detalhes_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `oportunidade_detalhes_oportunidade_id_key` ON `oportunidade_detalhes`(`oportunidade_id`);

-- CreateIndex
CREATE UNIQUE INDEX `oportunidades_detalhes_id_key` ON `oportunidades`(`detalhes_id`);

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_detalhes_id_fkey` FOREIGN KEY (`detalhes_id`) REFERENCES `oportunidade_detalhes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
