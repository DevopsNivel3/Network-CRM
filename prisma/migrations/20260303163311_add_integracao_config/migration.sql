ALTER TABLE `integracoes`
  ADD COLUMN `config` JSON NULL;

ALTER TABLE `integracoes`
  DROP COLUMN `instance_id`,
  DROP COLUMN `instance`,
  DROP COLUMN `webhook_id`,
  DROP COLUMN `webhook_url`;
