-- AlterTable
ALTER TABLE `integracoes`
  ADD COLUMN `webhook_id` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `integracoes_webhook_id_key`(`webhook_id`);
