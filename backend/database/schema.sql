CREATE DATABASE IF NOT EXISTS smart_split_bill
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_split_bill;

CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  service_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_participants_bill
    FOREIGN KEY (bill_id) REFERENCES bills(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_items_bill
    FOREIGN KEY (bill_id) REFERENCES bills(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  participant_id INT NOT NULL,
  UNIQUE KEY uq_item_participant (item_id, participant_id),
  CONSTRAINT fk_item_shares_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_item_shares_participant
    FOREIGN KEY (participant_id) REFERENCES participants(id)
    ON DELETE CASCADE
);
