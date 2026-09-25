ALTER TABLE `usuarios`
  ADD COLUMN `cpf` VARCHAR(11) NULL;

CREATE UNIQUE INDEX `usuarios_empresa_cpf_uq`
  ON `usuarios`(`empresa_id`, `cpf`);
