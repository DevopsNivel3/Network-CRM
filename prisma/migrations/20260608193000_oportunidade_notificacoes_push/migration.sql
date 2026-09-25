CREATE TABLE `notificacoes_usuario` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empresa_id` INTEGER NULL,
  `usuario_id` INTEGER NOT NULL,
  `tipo` VARCHAR(60) NOT NULL,
  `titulo` VARCHAR(180) NOT NULL,
  `mensagem` TEXT NOT NULL,
  `link` VARCHAR(255) NULL,
  `payload` JSON NULL,
  `lida` BOOLEAN NOT NULL DEFAULT false,
  `lida_em` DATETIME(3) NULL,
  `entregue_em` DATETIME(3) NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `notificacoes_usuario_empresa_id_fkey`(`empresa_id`),
  INDEX `notificacoes_usuario_usuario_lida_criado_idx`(`usuario_id`, `lida`, `criado`),
  INDEX `notificacoes_usuario_usuario_entregue_criado_idx`(`usuario_id`, `entregue_em`, `criado`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notificacoes_usuario`
  ADD CONSTRAINT `notificacoes_usuario_empresa_id_fkey`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `notificacoes_usuario`
  ADD CONSTRAINT `notificacoes_usuario_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
