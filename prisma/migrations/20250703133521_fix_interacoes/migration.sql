/*
  Warnings:

  - Added the required column `usuario_id` to the `oportunidade_interacoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oportunidade_interacoes` ADD COLUMN `usuario_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `oportunidade_interacoes` ADD CONSTRAINT `oportunidade_interacoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
