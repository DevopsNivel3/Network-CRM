-- CreateTable
CREATE TABLE `oportunidade_comentarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` LONGTEXT NOT NULL,
    `oportunidade_id` INTEGER NULL,
    `usuario_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oportunidade_comentarios` ADD CONSTRAINT `oportunidade_comentarios_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_comentarios` ADD CONSTRAINT `oportunidade_comentarios_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
