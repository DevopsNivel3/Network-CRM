-- CreateTable
CREATE TABLE `lead_comentarios_anexos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comentario_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `nome` TEXT NOT NULL,
  `url` TEXT NOT NULL,
  `tipo` VARCHAR(191) NULL,
  `tamanho` INT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `lead_comentarios_anexos_comentario_id_fkey`(`comentario_id`),
  INDEX `lead_comentarios_anexos_usuario_id_fkey`(`usuario_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oportunidade_comentarios_anexos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comentario_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `nome` TEXT NOT NULL,
  `url` TEXT NOT NULL,
  `tipo` VARCHAR(191) NULL,
  `tamanho` INT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `oportunidade_comentarios_anexos_comentario_id_fkey`(`comentario_id`),
  INDEX `oportunidade_comentarios_anexos_usuario_id_fkey`(`usuario_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oportunidade_interacoes_anexos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interacao_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `nome` TEXT NOT NULL,
  `url` TEXT NOT NULL,
  `tipo` VARCHAR(191) NULL,
  `tamanho` INT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `oportunidade_interacoes_anexos_interacao_id_fkey`(`interacao_id`),
  INDEX `oportunidade_interacoes_anexos_usuario_id_fkey`(`usuario_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_comentarios_anexos` ADD CONSTRAINT `lead_comentarios_anexos_comentario_id_fkey` FOREIGN KEY (`comentario_id`) REFERENCES `lead_comentarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_comentarios_anexos` ADD CONSTRAINT `lead_comentarios_anexos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_comentarios_anexos` ADD CONSTRAINT `oportunidade_comentarios_anexos_comentario_id_fkey` FOREIGN KEY (`comentario_id`) REFERENCES `oportunidade_comentarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_comentarios_anexos` ADD CONSTRAINT `oportunidade_comentarios_anexos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes_anexos` ADD CONSTRAINT `oportunidade_interacoes_anexos_interacao_id_fkey` FOREIGN KEY (`interacao_id`) REFERENCES `oportunidade_interacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes_anexos` ADD CONSTRAINT `oportunidade_interacoes_anexos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
