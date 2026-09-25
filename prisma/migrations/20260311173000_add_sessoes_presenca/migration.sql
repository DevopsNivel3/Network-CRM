CREATE TABLE `sessoes_presenca` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `usuario_id` INTEGER NOT NULL,
  `empresa_id` INTEGER NOT NULL,
  `codigo_sessao` VARCHAR(100) NOT NULL,
  `pagina_atual` VARCHAR(255) NULL,
  `ip` VARCHAR(64) NULL,
  `user_agent` TEXT NULL,
  `iniciado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ultimo_heartbeat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `encerrado` DATETIME(3) NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL,

  INDEX `sessoes_presenca_usuario_id_fkey`(`usuario_id`),
  INDEX `sessoes_presenca_empresa_id_fkey`(`empresa_id`),
  INDEX `sessoes_presenca_ultimo_heartbeat_idx`(`ultimo_heartbeat`),
  INDEX `sessoes_presenca_encerrado_idx`(`encerrado`),
  INDEX `sessoes_presenca_usuario_codigo_idx`(`usuario_id`, `codigo_sessao`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sessoes_presenca`
  ADD CONSTRAINT `sessoes_presenca_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sessoes_presenca_empresa_id_fkey`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
