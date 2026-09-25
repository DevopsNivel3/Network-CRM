ALTER TABLE `integracoes`
  ADD COLUMN `instance_id` VARCHAR(191) NULL;

CREATE INDEX `integracoes_instance_id_idx` ON `integracoes`(`instance_id`);
