-- Spring Boot runs this file after connecting to jewellery_shop_db.
CREATE TABLE IF NOT EXISTS app_state (
    id INT NOT NULL PRIMARY KEY,
    state_json JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_state (id, state_json)
VALUES (1, JSON_OBJECT());
