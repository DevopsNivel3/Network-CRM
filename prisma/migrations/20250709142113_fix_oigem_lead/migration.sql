/*
  Warnings:

  - You are about to drop the column `origem_lead` on the `oportunidades` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `leads` ADD COLUMN `origem_lead` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `oportunidades` DROP COLUMN `origem_lead`;
