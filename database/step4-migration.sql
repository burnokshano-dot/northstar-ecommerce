-- Run after Steps 1 and 3. Back up northstar_shop before importing.
USE northstar_shop;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(120) NOT NULL DEFAULT '' AFTER status,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(11) NOT NULL DEFAULT '' AFTER recipient_name,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(4) NOT NULL DEFAULT '' AFTER street_address,
  ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER postal_code,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cod' AFTER shipping_fee,
  ADD COLUMN IF NOT EXISTS checkout_key VARCHAR(100) NULL AFTER payment_method,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_checkout_key ON orders (user_id, checkout_key);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at);
