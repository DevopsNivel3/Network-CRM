-- Diagnostico para rodar antes do deploy em producao.
-- Lista CPF/CNPJ repetidos depois de remover pontuacao comum.

SELECT
    normalized.cpf_cnpj_normalizado,
    COUNT(*) AS total,
    GROUP_CONCAT(normalized.id ORDER BY normalized.id) AS lead_ids,
    GROUP_CONCAT(normalized.nome_lead ORDER BY normalized.id SEPARATOR ' | ') AS leads
FROM (
    SELECT
        id,
        nome_lead,
        NULLIF(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(TRIM(cpf_cnpj), '.', ''),
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
        ) AS cpf_cnpj_normalizado
    FROM leads
    WHERE cpf_cnpj IS NOT NULL
) AS normalized
WHERE normalized.cpf_cnpj_normalizado IS NOT NULL
GROUP BY normalized.cpf_cnpj_normalizado
HAVING COUNT(*) > 1
ORDER BY total DESC, normalized.cpf_cnpj_normalizado;
