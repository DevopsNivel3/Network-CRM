-- CreateTable
CREATE TABLE `oportunidade_detalhes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oportunidade_id` INTEGER NOT NULL,
    `qtd_mensagens_fechamento` INTEGER NULL DEFAULT 0,
    `qtd_mensagens_enviada` INTEGER NULL DEFAULT 0,
    `qtd_mensagens_respondida` INTEGER NULL DEFAULT 0,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidade_detalhes` ADD CONSTRAINT `oportunidade_detalhes_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
