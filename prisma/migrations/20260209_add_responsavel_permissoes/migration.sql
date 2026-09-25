ALTER TABLE oportunidade_responsaveis
  ADD COLUMN pode_editar BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pode_interacoes BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pode_visitas BOOLEAN NOT NULL DEFAULT false;
