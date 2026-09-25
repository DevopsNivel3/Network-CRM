-- Production safety:
-- Normalize CPF/CNPJ values so application-level duplicate validation can
-- compare new records consistently. This migration intentionally does not
-- deduplicate existing leads and does not create a global unique constraint.

UPDATE `leads`
SET `cpf_cnpj` = NULLIF(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(TRIM(`cpf_cnpj`), '.', ''),
                    '-',
                    ''
                ),
                '/',
                ''
            ),
            ' ',
            ''
        ),
        CHAR(9),
        ''
    ),
    ''
)
WHERE `cpf_cnpj` IS NOT NULL;

CREATE INDEX `leads_empresa_cpf_cnpj_idx` ON `leads`(`empresa_id`, `cpf_cnpj`);
