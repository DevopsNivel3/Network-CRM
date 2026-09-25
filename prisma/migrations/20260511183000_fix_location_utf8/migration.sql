UPDATE estados
SET nome = CONVERT(CAST(CONVERT(nome USING latin1) AS BINARY) USING utf8mb4)
WHERE nome LIKE '%Ã%' OR nome LIKE '%Â%';

UPDATE cidades
SET nome = CONVERT(CAST(CONVERT(nome USING latin1) AS BINARY) USING utf8mb4)
WHERE nome LIKE '%Ã%' OR nome LIKE '%Â%';
