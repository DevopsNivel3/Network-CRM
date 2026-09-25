-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_localizacao_id_fkey`;

-- DropIndex
DROP INDEX `visitas_localizacao_id_fkey` ON `visitas`;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_localizacao_id_fkey` FOREIGN KEY (`localizacao_id`) REFERENCES `localizacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
