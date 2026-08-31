-- MAMAHAIR.COM — migration initiale
-- Enums
CREATE TYPE "Role" AS ENUM ('CLIENT', 'STAFF', 'ADMIN');
CREATE TYPE "HairType" AS ENUM ('T3A', 'T3B', 'T3C', 'T4A', 'T4B', 'T4C');
CREATE TYPE "Porosity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "ProductType" AS ENUM ('WIG', 'BUNDLE', 'EXTENSION', 'CLOSURE', 'FRONTAL', 'HAIR_CARE', 'ACCESSORY', 'KIT');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ImageKind" AS ENUM ('MAIN', 'GALLERY', 'VARIANT', 'WORN', 'LACE_DETAIL', 'TEXTURE', 'PACKAGING');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MERCADO_PAGO', 'PAYPAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED', 'FREE_SHIPPING');

-- Users
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "firstName" TEXT, "lastName" TEXT, "phone" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CLIENT', "locale" TEXT NOT NULL DEFAULT 'en', "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT, "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "HairProfile" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "hairType" "HairType", "porosity" "Porosity",
  "concerns" TEXT[], "quiz" JSONB, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HairProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HairProfile_userId_key" ON "HairProfile"("userId");
ALTER TABLE "HairProfile" ADD CONSTRAINT "HairProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Address" (
  "id" TEXT NOT NULL, "userId" TEXT, "fullName" TEXT NOT NULL, "line1" TEXT NOT NULL, "line2" TEXT, "city" TEXT NOT NULL,
  "region" TEXT, "postalCode" TEXT, "country" TEXT NOT NULL, "phone" TEXT, "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Catalogue
CREATE TABLE "Category" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "imageUrl" TEXT, "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true, "showOnHome" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CategoryTranslation" (
  "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "locale" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "sku" TEXT, "name" TEXT NOT NULL, "shortDesc" TEXT, "description" TEXT,
  "ingredients" TEXT, "howToUse" TEXT, "brand" TEXT,
  "productType" "ProductType" NOT NULL DEFAULT 'HAIR_CARE', "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE', "categoryId" TEXT,
  "hairTypes" "HairType"[], "concerns" TEXT[], "porosities" "Porosity"[],
  "hairMaterial" TEXT, "hairOrigin" TEXT, "textures" TEXT[], "lengths" INTEGER[], "densities" TEXT[], "laceTypes" TEXT[], "colors" TEXT[],
  "capSize" TEXT, "wigType" TEXT, "closureType" TEXT, "parting" TEXT, "hairGrade" TEXT, "bundlesCount" INTEGER,
  "canBleach" BOOLEAN, "canDye" BOOLEAN, "heatSafe" BOOLEAN, "prePlucked" BOOLEAN, "babyHair" BOOLEAN, "glueless" BOOLEAN, "adjustableStrap" BOOLEAN,
  "attributes" JSONB,
  "basePriceCents" INTEGER NOT NULL, "compareAtCents" INTEGER, "costCents" INTEGER, "currency" TEXT NOT NULL DEFAULT 'USD', "weightGrams" INTEGER,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false, "isBestSeller" BOOLEAN NOT NULL DEFAULT false, "isNew" BOOLEAN NOT NULL DEFAULT false,
  "isBundle" BOOLEAN NOT NULL DEFAULT false, "bundlePriceCents" INTEGER, "seoTitle" TEXT, "seoDescription" TEXT,
  "salesCount" INTEGER NOT NULL DEFAULT 0, "ratingAvg" DOUBLE PRECISION, "ratingCount" INTEGER NOT NULL DEFAULT 0, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_status_isFeatured_idx" ON "Product"("status", "isFeatured");
CREATE INDEX "Product_status_productType_idx" ON "Product"("status", "productType");
CREATE INDEX "Product_status_isBestSeller_idx" ON "Product"("status", "isBestSeller");
CREATE INDEX "Product_status_isNew_idx" ON "Product"("status", "isNew");
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductTranslation" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "locale" TEXT NOT NULL, "name" TEXT NOT NULL, "shortDesc" TEXT, "description" TEXT, "ingredients" TEXT, "howToUse" TEXT,
  CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "url" TEXT NOT NULL, "path" TEXT, "alt" TEXT,
  "kind" "ImageKind" NOT NULL DEFAULT 'GALLERY', "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "sku" TEXT NOT NULL, "name" TEXT NOT NULL, "options" JSONB,
  "priceCents" INTEGER NOT NULL, "compareAtCents" INTEGER, "costCents" INTEGER, "weightGrams" INTEGER, "imageId" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProductImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Inventory" (
  "id" TEXT NOT NULL, "variantId" TEXT NOT NULL, "quantity" INTEGER NOT NULL DEFAULT 0, "reserved" INTEGER NOT NULL DEFAULT 0,
  "lowStockAt" INTEGER NOT NULL DEFAULT 5, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Inventory_variantId_key" ON "Inventory"("variantId");
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Protection base contre le stock négatif
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_quantity_nonneg" CHECK ("quantity" >= 0);
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_reserved_nonneg" CHECK ("reserved" >= 0);
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_reserved_lte_quantity" CHECK ("reserved" <= "quantity");

CREATE TABLE "BundleItem" (
  "id" TEXT NOT NULL, "bundleId" TEXT NOT NULL, "variantId" TEXT NOT NULL, "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BundleItem_bundleId_variantId_key" ON "BundleItem"("bundleId", "variantId");
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WishlistItem" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "variantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Promotions (avant Cart pour la FK)
CREATE TABLE "Discount" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "type" "DiscountType" NOT NULL, "value" INTEGER NOT NULL, "currency" TEXT,
  "minOrderCents" INTEGER, "maxUses" INTEGER, "usesPerCustomer" INTEGER, "usedCount" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3), "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

CREATE TABLE "_DiscountCategories" ("A" TEXT NOT NULL, "B" TEXT NOT NULL, CONSTRAINT "_DiscountCategories_AB_pkey" PRIMARY KEY ("A","B"));
CREATE INDEX "_DiscountCategories_B_index" ON "_DiscountCategories"("B");
ALTER TABLE "_DiscountCategories" ADD CONSTRAINT "_DiscountCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_DiscountCategories" ADD CONSTRAINT "_DiscountCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_DiscountProducts" ("A" TEXT NOT NULL, "B" TEXT NOT NULL, CONSTRAINT "_DiscountProducts_AB_pkey" PRIMARY KEY ("A","B"));
CREATE INDEX "_DiscountProducts_B_index" ON "_DiscountProducts"("B");
ALTER TABLE "_DiscountProducts" ADD CONSTRAINT "_DiscountProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_DiscountProducts" ADD CONSTRAINT "_DiscountProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Panier
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL, "userId" TEXT, "sessionId" TEXT, "email" TEXT, "currency" TEXT NOT NULL DEFAULT 'USD', "discountId" TEXT,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "recoveryEmailSentAt" TIMESTAMP(3), "convertedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");
CREATE INDEX "Cart_lastActivityAt_convertedAt_idx" ON "Cart"("lastActivityAt", "convertedAt");
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL, "cartId" TEXT NOT NULL, "variantId" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Livraison
CREATE TABLE "ShippingZone" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "countries" TEXT[], "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ShippingRate" (
  "id" TEXT NOT NULL, "zoneId" TEXT NOT NULL, "name" TEXT NOT NULL, "priceCents" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD',
  "freeAboveCents" INTEGER, "minWeightGrams" INTEGER, "maxWeightGrams" INTEGER, "minDays" INTEGER, "maxDays" INTEGER, "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "TaxRate" (
  "id" TEXT NOT NULL, "zoneId" TEXT NOT NULL, "region" TEXT, "name" TEXT NOT NULL, "rateBps" INTEGER NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Commandes
CREATE TABLE "Order" (
  "id" TEXT NOT NULL, "number" SERIAL NOT NULL, "userId" TEXT, "email" TEXT NOT NULL, "phone" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT', "currency" TEXT NOT NULL,
  "subtotalCents" INTEGER NOT NULL, "discountCents" INTEGER NOT NULL DEFAULT 0, "shippingCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0, "totalCents" INTEGER NOT NULL, "refundedCents" INTEGER NOT NULL DEFAULT 0, "discountCode" TEXT,
  "shippingAddress" JSONB NOT NULL, "billingAddress" JSONB, "shippingRateId" TEXT, "notes" TEXT, "internalNotes" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en', "expiresAt" TIMESTAMP(3), "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_email_idx" ON "Order"("email");
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingRateId_fkey" FOREIGN KEY ("shippingRateId") REFERENCES "ShippingRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "variantId" TEXT NOT NULL, "productName" TEXT NOT NULL, "variantName" TEXT NOT NULL,
  "sku" TEXT NOT NULL, "options" JSONB, "imageUrl" TEXT, "unitCents" INTEGER NOT NULL, "quantity" INTEGER NOT NULL, "totalCents" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "status" "OrderStatus" NOT NULL, "note" TEXT, "actor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StockReservation" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "variantId" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "releasedAt" TIMESTAMP(3), "committedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockReservation_expiresAt_releasedAt_committedAt_idx" ON "StockReservation"("expiresAt", "releasedAt", "committedAt");
CREATE INDEX "StockReservation_orderId_idx" ON "StockReservation"("orderId");
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE', "providerId" TEXT, "intentId" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING', "amountCents" INTEGER NOT NULL, "currency" TEXT NOT NULL,
  "refundedCents" INTEGER NOT NULL DEFAULT 0, "method" TEXT, "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX "Payment_providerId_key" ON "Payment"("providerId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL, "provider" "PaymentProvider" NOT NULL, "type" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "carrier" TEXT, "trackingNumber" TEXT, "trackingUrl" TEXT, "labelUrl" TEXT,
  "shippedAt" TIMESTAMP(3), "deliveredAt" TIMESTAMP(3),
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Avis, contenu, paramètres
CREATE TABLE "Review" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "userId" TEXT NOT NULL, "rating" INTEGER NOT NULL, "title" TEXT, "body" TEXT,
  "photoUrls" TEXT[], "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false, "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");
CREATE INDEX "Review_productId_isApproved_idx" ON "Review"("productId", "isApproved");
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

CREATE TABLE "Page" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "locale" TEXT NOT NULL DEFAULT 'en', "title" TEXT NOT NULL, "content" TEXT NOT NULL,
  "seoTitle" TEXT, "seoDescription" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Page_slug_locale_key" ON "Page"("slug", "locale");

CREATE TABLE "Post" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "locale" TEXT NOT NULL DEFAULT 'en', "title" TEXT NOT NULL, "excerpt" TEXT, "content" TEXT NOT NULL,
  "coverUrl" TEXT, "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Post_slug_locale_key" ON "Post"("slug", "locale");

CREATE TABLE "HomeBlock" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "locale" TEXT NOT NULL DEFAULT 'en', "data" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomeBlock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HomeBlock_key_locale_key" ON "HomeBlock"("key", "locale");

CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "locale" TEXT NOT NULL DEFAULT 'en', "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

CREATE TABLE "Setting" (
  "key" TEXT NOT NULL, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
