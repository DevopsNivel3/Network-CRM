-- AlterTable
ALTER TABLE `board_oportunidades`
ADD COLUMN `usuario_atribuido_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `board_oportunidades_usuario_atribuido_id_fkey`
ON `board_oportunidades`(`usuario_atribuido_id`);

-- AddForeignKey
ALTER TABLE `board_oportunidades`
ADD CONSTRAINT `board_oportunidades_usuario_atribuido_id_fkey`
FOREIGN KEY (`usuario_atribuido_id`) REFERENCES `usuarios`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
