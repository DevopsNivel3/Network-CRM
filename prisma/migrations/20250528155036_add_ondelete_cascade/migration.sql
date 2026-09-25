-- DropForeignKey
ALTER TABLE `oportunidade_comentarios` DROP FOREIGN KEY `oportunidade_comentarios_oportunidade_id_fkey`;

-- DropIndex
DROP INDEX `oportunidade_comentarios_oportunidade_id_fkey` ON `oportunidade_comentarios`;

-- AddForeignKey
ALTER TABLE `oportunidade_comentarios` ADD CONSTRAINT `oportunidade_comentarios_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
