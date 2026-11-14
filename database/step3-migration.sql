-- Run ONCE via phpMyAdmin > Import for your existing Step 2 database.
-- Does not erase any customers, products, inventory, or orders.
USE northstar_shop;
CREATE TABLE IF NOT EXISTS customer_addresses (
  user_id INT UNSIGNED PRIMARY KEY,
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  province VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  barangay VARCHAR(120) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  postal_code VARCHAR(4) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
