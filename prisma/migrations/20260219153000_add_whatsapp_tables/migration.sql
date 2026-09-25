-- CreateTable
CREATE TABLE `whatsapp_contatos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empresa_id` INTEGER NOT NULL,
  `lead_id` INTEGER NULL,
  `numero` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NULL,
  `foto_url` VARCHAR(191) NULL,
  `is_whatsapp` BOOLEAN NOT NULL DEFAULT false,
  `ultimo_check` DATETIME(3) NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL,

  INDEX `whatsapp_contatos_empresa_numero_idx`(`empresa_id`, `numero`),
  INDEX `whatsapp_contatos_lead_id_fkey`(`lead_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `whatsapp_contatos_empresa_id_fkey`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `whatsapp_contatos_lead_id_fkey`
    FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_mensagens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empresa_id` INTEGER NOT NULL,
  `lead_id` INTEGER NULL,
  `numero` VARCHAR(191) NOT NULL,
  `direction` VARCHAR(191) NOT NULL,
  `body` LONGTEXT NULL,
  `message_id` VARCHAR(191) NULL,
  `timestamp` DATETIME(3) NULL,
  `raw` JSON NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `whatsapp_mensagens_empresa_lead_idx`(`empresa_id`, `lead_id`),
  INDEX `whatsapp_mensagens_empresa_numero_idx`(`empresa_id`, `numero`),
  INDEX `whatsapp_mensagens_lead_id_fkey`(`lead_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `whatsapp_mensagens_empresa_id_fkey`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `whatsapp_mensagens_lead_id_fkey`
    FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_templates` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empresa_id` INTEGER NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `corpo` TEXT NOT NULL,
  `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado` DATETIME(3) NOT NULL,

  INDEX `whatsapp_templates_empresa_id_fkey`(`empresa_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `whatsapp_templates_empresa_id_fkey`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
