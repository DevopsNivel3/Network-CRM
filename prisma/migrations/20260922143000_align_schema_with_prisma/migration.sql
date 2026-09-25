-- DropForeignKey
ALTER TABLE `leads_interacoes` DROP FOREIGN KEY `leads_interacoes_lead_id_fkey`;

-- DropForeignKey
ALTER TABLE `leads_interacoes` DROP FOREIGN KEY `leads_interacoes_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `lembretes_config` DROP FOREIGN KEY `lembretes_config_empresa_id_fkey`;

-- AlterTable
ALTER TABLE `leads` DROP COLUMN `proximo_followup_em`,
    DROP COLUMN `ultima_interacao_em`;

-- AlterTable
ALTER TABLE `notificacoes_usuario` ALTER COLUMN `atualizado` DROP DEFAULT;

-- DropTable
DROP TABLE `leads_interacoes`;

-- DropTable
DROP TABLE `lembretes_config`;

-- CreateTable
CREATE TABLE `lembretes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NOT NULL,
    `lead_id` INTEGER NULL,
    `oportunidade_id` INTEGER NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `data_vencimento` DATETIME(3) NOT NULL,
    `prioridade` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pendente',
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    INDEX `lembretes_empresa_id_fkey`(`empresa_id`),
    INDEX `lembretes_lead_id_fkey`(`lead_id`),
    INDEX `lembretes_oportunidade_id_fkey`(`oportunidade_id`),
    INDEX `lembretes_usuario_id_fkey`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_interacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NOT NULL,
    `lead_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `data_interacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    INDEX `lead_interacoes_empresa_id_fkey`(`empresa_id`),
    INDEX `lead_interacoes_lead_id_fkey`(`lead_id`),
    INDEX `lead_interacoes_usuario_id_fkey`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `leads_empresa_id_fkey` ON `leads`(`empresa_id`);

-- CreateIndex
CREATE INDEX `leads_usuario_id_fkey` ON `leads`(`usuario_id`);

-- CreateIndex
CREATE INDEX `oportunidade_interacoes_usuario_id_fkey` ON `oportunidade_interacoes`(`usuario_id`);

-- CreateIndex
CREATE INDEX `oportunidades_usuario_id_fkey` ON `oportunidades`(`usuario_id`);

-- CreateIndex
CREATE INDEX `oportunidades_board_id_fkey` ON `oportunidades`(`board_id`);

-- AddForeignKey
ALTER TABLE `lembretes` ADD CONSTRAINT `lembretes_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembretes` ADD CONSTRAINT `lembretes_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembretes` ADD CONSTRAINT `lembretes_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembretes` ADD CONSTRAINT `lembretes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_interacoes` ADD CONSTRAINT `lead_interacoes_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_interacoes` ADD CONSTRAINT `lead_interacoes_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_interacoes` ADD CONSTRAINT `lead_interacoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
