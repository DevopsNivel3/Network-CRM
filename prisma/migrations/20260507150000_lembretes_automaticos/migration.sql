-- AlterTable
ALTER TABLE `leads`
    ADD COLUMN `ultima_interacao_em` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `leads_interacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(30) NOT NULL,
    `descricao` TEXT NULL,
    `origem` VARCHAR(30) NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lead_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NULL,

    INDEX `leads_interacoes_lead_id_criado_idx`(`lead_id`, `criado`),
    INDEX `leads_interacoes_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lembretes_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `intervalos_dias` JSON NOT NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `empresa_id` INTEGER NOT NULL,

    UNIQUE INDEX `lembretes_config_empresa_id_key`(`empresa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leads_interacoes`
    ADD CONSTRAINT `leads_interacoes_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads_interacoes`
    ADD CONSTRAINT `leads_interacoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembretes_config`
    ADD CONSTRAINT `lembretes_config_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
