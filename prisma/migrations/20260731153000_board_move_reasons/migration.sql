ALTER TABLE `board_oportunidades`
  ADD COLUMN `exige_motivo` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `grupo_motivos` VARCHAR(191) NULL,
  ADD COLUMN `motivos` JSON NULL,
  ADD COLUMN `exigir_obs_outro` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `oportunidade_historico`
  ADD COLUMN `motivo` VARCHAR(191) NULL,
  ADD COLUMN `motivo_observacao` TEXT NULL;
