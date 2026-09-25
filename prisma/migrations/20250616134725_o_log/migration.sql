-- CreateTable
CREATE TABLE `oportunidade_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oportunidade_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `statusInt` INTEGER NULL DEFAULT 1,
    `posicao` DOUBLE NOT NULL DEFAULT 0,
    `acao` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidade_historico` ADD CONSTRAINT `oportunidade_historico_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_historico` ADD CONSTRAINT `oportunidade_historico_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
