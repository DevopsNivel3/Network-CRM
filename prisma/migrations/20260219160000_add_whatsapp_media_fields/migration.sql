ALTER TABLE `whatsapp_mensagens`
  ADD COLUMN `usuario_id` INTEGER NULL,
  ADD COLUMN `media_type` VARCHAR(32) NULL,
  ADD COLUMN `media_mime` VARCHAR(191) NULL,
  ADD COLUMN `media_base64` LONGTEXT NULL,
  ADD COLUMN `media_name` VARCHAR(191) NULL,
  ADD COLUMN `media_caption` TEXT NULL;

ALTER TABLE `whatsapp_mensagens`
  ADD CONSTRAINT `whatsapp_mensagens_usuario_id_fkey`
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
