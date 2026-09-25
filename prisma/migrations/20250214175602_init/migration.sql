-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_lead` VARCHAR(191) NOT NULL,
    `cpf_cnpj` VARCHAR(191) NOT NULL,
    `responsavel` VARCHAR(191) NOT NULL,
    `contato_nome` VARCHAR(191) NOT NULL,
    `contato` VARCHAR(191) NOT NULL,
    `atividade` VARCHAR(191) NOT NULL,
    `faturamento` VARCHAR(191) NOT NULL,
    `num_funcionarios` INTEGER NOT NULL,
    `observacoes` LONGTEXT NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `empresa_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `contato` VARCHAR(191) NOT NULL,
    `permissoes` INTEGER NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `desativado` BOOLEAN NOT NULL DEFAULT false,
    `usuario_id` INTEGER NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `empresa_id` INTEGER NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `contato` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `desativado` BOOLEAN NOT NULL DEFAULT false,
    `usuario_id` INTEGER NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oportunidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NULL,
    `descricao` TEXT NULL,
    `status` VARCHAR(50) NULL DEFAULT 'Frio',
    `valor_estimado` DECIMAL(10, 2) NULL,
    `faixa_valor` VARCHAR(191) NULL,
    `num_pdvs` INTEGER NULL,
    `num_lojas` INTEGER NULL,
    `observacoes` LONGTEXT NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `lead_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data_inicio` DATETIME(3) NOT NULL,
    `data_fim` DATETIME(3) NULL,
    `imagem_src` VARCHAR(255) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `localizacao_id` INTEGER NOT NULL,
    `oportunidade_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `uf` VARCHAR(191) NOT NULL,
    `ibge` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `estado_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `localizacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rua` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `complemento` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,
    `lead_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_localizacao_id_fkey` FOREIGN KEY (`localizacao_id`) REFERENCES `localizacoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_oportunidade_id_fkey` FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cidades` ADD CONSTRAINT `cidades_estado_id_fkey` FOREIGN KEY (`estado_id`) REFERENCES `estados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `localizacoes` ADD CONSTRAINT `localizacoes_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
