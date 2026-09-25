CREATE TABLE `mobile_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `usuario_id` INTEGER NOT NULL,
  `dispositivo` VARCHAR(180) NULL,
  `plataforma` VARCHAR(30) NULL,
  `expira_em` DATETIME(3) NOT NULL,
  `revogado_em` DATETIME(3) NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL,
  UNIQUE INDEX `mobile_sessions_token_hash_key`(`token_hash`),
  INDEX `mobile_sessions_usuario_status_idx`(`usuario_id`, `revogado_em`, `expira_em`),
  PRIMARY KEY (`id`),
  CONSTRAINT `mobile_sessions_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
