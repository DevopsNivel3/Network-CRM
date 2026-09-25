-- DropForeignKey
ALTER TABLE `cidades` DROP FOREIGN KEY `cidades_estado_id_fkey`;

-- DropForeignKey
ALTER TABLE `leads` DROP FOREIGN KEY `leads_empresa_id_fkey`;

-- DropForeignKey
ALTER TABLE `leads` DROP FOREIGN KEY `leads_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `oportunidade_historico` DROP FOREIGN KEY `oportunidade_historico_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `oportunidade_interacoes` DROP FOREIGN KEY `oportunidade_interacoes_oportunidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `oportunidade_interacoes` DROP FOREIGN KEY `oportunidade_interacoes_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `oportunidades` DROP FOREIGN KEY `oportunidades_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_oportunidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_usuario_id_fkey`;

-- AlterTable
ALTER TABLE `lead_grupo_vinculos` ALTER COLUMN `atualizado` DROP DEFAULT;

-- AlterTable
ALTER TABLE `lead_grupos` ALTER COLUMN `atualizado` DROP DEFAULT;

-- AlterTable
ALTER TABLE `whatsapp_mensagens` MODIFY `direction` VARCHAR(191) NOT NULL,
    MODIFY `media_type` VARCHAR(191) NULL,
    MODIFY `media_caption` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_historico` ADD CONSTRAINT `oportunidade_historico_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes` ADD CONSTRAINT `oportunidade_interacoes_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes` ADD CONSTRAINT `oportunidade_interacoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cidades` ADD CONSTRAINT `cidades_estado_id_fkey` FOREIGN KEY (`estado_id`) REFERENCES `estados`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
