-- AlterTable
ALTER TABLE `oportunidades` ADD COLUMN `board_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `board_oportunidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `cor` VARCHAR(191) NULL DEFAULT '#3B82F6',
    `posicao` DOUBLE NOT NULL DEFAULT 0,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_board_id_fkey` FOREIGN KEY (`board_id`) REFERENCES `board_oportunidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
