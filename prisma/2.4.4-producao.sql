-- Ajustes de producao para a versao 2.4.4
-- Banco: network

-- Campos usados pelos lembretes de leads/oportunidades.
SET @add_leads_controle_lembretes = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE leads ADD COLUMN controle_lembretes BOOLEAN NOT NULL DEFAULT TRUE',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leads'
    AND COLUMN_NAME = 'controle_lembretes'
);

PREPARE stmt FROM @add_leads_controle_lembretes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_oportunidades_controle_lembretes = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE oportunidades ADD COLUMN controle_lembretes BOOLEAN NOT NULL DEFAULT TRUE',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'oportunidades'
    AND COLUMN_NAME = 'controle_lembretes'
);

PREPARE stmt FROM @add_oportunidades_controle_lembretes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Libera CRM e Financeiro para a empresa do usuario admin@lanlimp.
UPDATE empresas e
JOIN usuarios u ON u.empresa_id = e.id
SET e.modulos = JSON_ARRAY('CRM', 'FINANCEIRO'),
    e.desativado = 0,
    u.desativado = 0
WHERE u.email = 'admin@lanlimp';

-- Garante modulos padrao para empresas antigas que ficaram com modulos NULL.
UPDATE empresas
SET modulos = JSON_ARRAY('CRM', 'FINANCEIRO')
WHERE modulos IS NULL;
