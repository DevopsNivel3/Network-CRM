-- CreateTable
CREATE TABLE `push_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NULL,
    `usuario_id` INTEGER NOT NULL,
    `endpoint` VARCHAR(500) NOT NULL,
    `p256dh` VARCHAR(255) NOT NULL,
    `auth` VARCHAR(255) NOT NULL,
    `expiration` DATETIME(3) NULL,
    `user_agent` TEXT NULL,
    `criado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado` DATETIME(3) NOT NULL,

    UNIQUE INDEX `push_subscriptions_endpoint_key`(`endpoint`),
    INDEX `push_subscriptions_empresa_id_fkey`(`empresa_id`),
    INDEX `push_subscriptions_usuario_id_fkey`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `push_subscriptions`
ADD CONSTRAINT `push_subscriptions_empresa_id_fkey`
FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `push_subscriptions`
ADD CONSTRAINT `push_subscriptions_usuario_id_fkey`
FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
