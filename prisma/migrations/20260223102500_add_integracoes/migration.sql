-- CreateTable
CREATE TABLE `integracoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empresa_id` INT NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `instance` VARCHAR(191) NULL,
  `webhook_url` VARCHAR(191) NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `integracoes_empresa_tipo_uq`(`empresa_id`, `tipo`),
  INDEX `integracoes_tipo_idx`(`tipo`),
  INDEX `integracoes_instance_idx`(`instance`),
  CONSTRAINT `integracoes_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- DropTable
DROP TABLE IF EXISTS `whatsapp_configs`;
