CREATE INDEX `leads_empresa_criado_idx` ON `leads` (`empresa_id`, `criado`);
CREATE INDEX `leads_usuario_criado_idx` ON `leads` (`usuario_id`, `criado`);

CREATE INDEX `oportunidades_usuario_criado_idx` ON `oportunidades` (`usuario_id`, `criado`);
CREATE INDEX `oportunidades_board_criado_idx` ON `oportunidades` (`board_id`, `criado`);
CREATE INDEX `oportunidades_criado_idx` ON `oportunidades` (`criado`);

CREATE INDEX `oportunidade_interacoes_data_oportunidade_idx`
  ON `oportunidade_interacoes` (`data`, `oportunidade_id`);
CREATE INDEX `oportunidade_interacoes_usuario_data_idx`
  ON `oportunidade_interacoes` (`usuario_id`, `data`);

CREATE INDEX `oportunidade_historico_criado_board_idx`
  ON `oportunidade_historico` (`criado`, `board_id`);
