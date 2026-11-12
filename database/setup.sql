-- Jewellery Shop Management System
-- Run this script in MySQL Workbench or with the MySQL command-line client.
-- Requires MySQL 5.7.8+ because the project uses the JSON column type.

CREATE DATABASE IF NOT EXISTS jewellery_shop_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE jewellery_shop_db;

CREATE TABLE IF NOT EXISTS app_state (
    id INT NOT NULL PRIMARY KEY,
    state_json JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Create the initial application-state record if it does not already exist.
-- The application can replace this empty JSON object with saved shop data.
INSERT IGNORE INTO app_state (id, state_json)
VALUES (1, JSON_OBJECT());
