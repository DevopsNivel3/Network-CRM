-- CreateTable
CREATE TABLE `lead_grupos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `empresa_id` INT NOT NULL,
  `usuario_id` INT NULL,

  PRIMARY KEY (`id`),
  INDEX `lead_grupos_empresa_id_fkey`(`empresa_id`),
  INDEX `lead_grupos_usuario_id_fkey`(`usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_grupo_vinculos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `grupo_id` INT NOT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `lead_grupo_unique`(`lead_id`, `grupo_id`),
  INDEX `lead_grupo_vinculos_lead_id_fkey`(`lead_id`),
  INDEX `lead_grupo_vinculos_grupo_id_fkey`(`grupo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_grupos` ADD CONSTRAINT `lead_grupos_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lead_grupos` ADD CONSTRAINT `lead_grupos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_grupo_vinculos` ADD CONSTRAINT `lead_grupo_vinculos_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lead_grupo_vinculos` ADD CONSTRAINT `lead_grupo_vinculos_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `lead_grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
