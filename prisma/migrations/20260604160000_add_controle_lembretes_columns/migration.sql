ALTER TABLE `leads`
ADD COLUMN `controle_lembretes` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `oportunidades`
ADD COLUMN `controle_lembretes` BOOLEAN NOT NULL DEFAULT true;
