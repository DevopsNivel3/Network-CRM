/*
  Warnings:

  - You are about to drop the column `statusInt` on the `oportunidade_historico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `oportunidade_historico` DROP COLUMN `statusInt`,
    ADD COLUMN `board_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `oportunidade_responsaveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oportunidade_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidade_responsaveis` ADD CONSTRAINT `oportunidade_responsaveis_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_responsaveis` ADD CONSTRAINT `oportunidade_responsaveis_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
