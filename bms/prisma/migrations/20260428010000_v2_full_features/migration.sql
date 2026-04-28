-- Schema v2: Simplify OrderStatus + isGift + city + distributorId + routeRunId + extended PaymentMethod + OrderReturn + RouteRun + RouteExpense

-- AlterEnum: OrderStatus — remove draft and confirmed, change default to ready_for_distribution
ALTER TABLE `orders` MODIFY COLUMN `status` ENUM('ready_for_distribution', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'ready_for_distribution';

-- AlterEnum: PaymentMethod — remove CHECK and OTHER, add CREDIT, INSTALLMENT, SETTLEMENT
ALTER TABLE `payments` MODIFY COLUMN `method` ENUM('CASH', 'BANK_TRANSFER', 'CREDIT', 'INSTALLMENT', 'SETTLEMENT') NOT NULL DEFAULT 'CASH';

-- AlterTable: shops — add city column
ALTER TABLE `shops` ADD COLUMN `city` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable: order_items — add isGift column
ALTER TABLE `order_items` ADD COLUMN `isGift` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: orders — add distributorId and routeRunId columns
ALTER TABLE `orders` ADD COLUMN `distributorId` VARCHAR(191) NULL;
ALTER TABLE `orders` ADD COLUMN `routeRunId` VARCHAR(191) NULL;

-- CreateTable: route_runs
CREATE TABLE `route_runs` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `distributorId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NULL,
    `whiteBagsLoaded` INTEGER NOT NULL DEFAULT 0,
    `brownBagsLoaded` INTEGER NOT NULL DEFAULT 0,
    `reserveBags` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `route_runs_distributorId_idx`(`distributorId`),
    INDEX `route_runs_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: route_expenses
CREATE TABLE `route_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `routeRunId` VARCHAR(191) NOT NULL,
    `type` ENUM('FUEL', 'OTHER') NOT NULL DEFAULT 'FUEL',
    `amount` DECIMAL(10, 2) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: order_returns
CREATE TABLE `order_returns` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex: orders
CREATE INDEX `orders_shopId_idx` ON `orders`(`shopId`);
CREATE INDEX `orders_distributorId_idx` ON `orders`(`distributorId`);
CREATE INDEX `orders_routeRunId_idx` ON `orders`(`routeRunId`);

-- CreateIndex: payments
CREATE INDEX `payments_shopId_idx` ON `payments`(`shopId`);

-- AddForeignKey: route_runs
ALTER TABLE `route_runs` ADD CONSTRAINT `route_runs_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `route_runs` ADD CONSTRAINT `route_runs_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: route_expenses
ALTER TABLE `route_expenses` ADD CONSTRAINT `route_expenses_routeRunId_fkey` FOREIGN KEY (`routeRunId`) REFERENCES `route_runs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: order_returns
ALTER TABLE `order_returns` ADD CONSTRAINT `order_returns_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `order_returns` ADD CONSTRAINT `order_returns_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `order_returns` ADD CONSTRAINT `order_returns_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: orders (distributorId and routeRunId)
ALTER TABLE `orders` ADD CONSTRAINT `orders_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `orders_routeRunId_fkey` FOREIGN KEY (`routeRunId`) REFERENCES `route_runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
