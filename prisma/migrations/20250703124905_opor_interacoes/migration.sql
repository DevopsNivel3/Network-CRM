/*
  Warnings:

  - You are about to drop the column `detalhes_id` on the `oportunidades` table. All the data in the column will be lost.
  - You are about to drop the `oportunidade_detalhes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `oportunidades` DROP FOREIGN KEY `oportunidades_detalhes_id_fkey`;

-- DropIndex
DROP INDEX `oportunidades_detalhes_id_key` ON `oportunidades`;

-- AlterTable
ALTER TABLE `oportunidades` DROP COLUMN `detalhes_id`;

-- DropTable
DROP TABLE `oportunidade_detalhes`;

-- CreateTable
CREATE TABLE `oportunidade_interacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oportunidade_id` INTEGER NOT NULL,
    `statusInt` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `conteudo` LONGTEXT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes` ADD CONSTRAINT `oportunidade_interacoes_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
