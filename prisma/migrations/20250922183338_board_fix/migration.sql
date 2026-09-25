-- AlterTable
ALTER TABLE `board_oportunidades` ADD COLUMN `empresa_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `board_oportunidades` ADD CONSTRAINT `board_oportunidades_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
