-- npx prisma migrate dev --name add_responsavel_permissoes
-- npx prisma migrate deploy

INSERT INTO network.oportunidade_responsaveis (oportunidade_id, usuario_id, pode_editar, pode_interacoes, pode_visitas, principal, criado, atualizado)
SELECT o.id, o.usuario_id, TRUE, TRUE, TRUE, TRUE, NOW(), NOW()
FROM network.oportunidades o
LEFT JOIN network.oportunidade_responsaveis r
  ON r.oportunidade_id = o.id AND r.usuario_id = o.usuario_id
WHERE r.usuario_id IS NULL;


UPDATE empresas
SET modulos = JSON_ARRAY('CRM')
WHERE modulos IS NULL;
