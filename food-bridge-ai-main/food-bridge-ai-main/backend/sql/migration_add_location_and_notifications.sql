SET @has_lat := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'donations'
    AND column_name = 'location_latitude'
);
SET @sql_add_lat := IF(
  @has_lat = 0,
  'ALTER TABLE donations ADD COLUMN location_latitude DECIMAL(10,7) NULL AFTER location',
  'SELECT "location_latitude already exists"'
);
PREPARE stmt_add_lat FROM @sql_add_lat;
EXECUTE stmt_add_lat;
DEALLOCATE PREPARE stmt_add_lat;

SET @has_lng := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'donations'
    AND column_name = 'location_longitude'
);
SET @sql_add_lng := IF(
  @has_lng = 0,
  'ALTER TABLE donations ADD COLUMN location_longitude DECIMAL(10,7) NULL AFTER location_latitude',
  'SELECT "location_longitude already exists"'
);
PREPARE stmt_add_lng FROM @sql_add_lng;
EXECUTE stmt_add_lng;
DEALLOCATE PREPARE stmt_add_lng;

CREATE TABLE IF NOT EXISTS ngo_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_user_id INT NOT NULL UNIQUE,
  organization_name VARCHAR(180) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15,
  contact_email VARCHAR(180) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  notify_email TINYINT(1) NOT NULL DEFAULT 1,
  notify_sms TINYINT(1) NOT NULL DEFAULT 0,
  notify_push TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ngo_profile_user FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_user_id INT NOT NULL,
  endpoint VARCHAR(500) NOT NULL UNIQUE,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_sub_ngo FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_user_id INT NOT NULL,
  donation_id INT NOT NULL,
  channel ENUM('email', 'sms', 'push') NOT NULL,
  status ENUM('sent', 'failed') NOT NULL,
  recipient VARCHAR(255) NULL,
  distance_km DECIMAL(8,3) NULL,
  message VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_ngo FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

SET @has_idx_don_loc := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'donations'
    AND index_name = 'idx_donations_location'
);
SET @sql_idx_don_loc := IF(
  @has_idx_don_loc = 0,
  'CREATE INDEX idx_donations_location ON donations(location_latitude, location_longitude)',
  'SELECT "idx_donations_location already exists"'
);
PREPARE stmt_idx_don_loc FROM @sql_idx_don_loc;
EXECUTE stmt_idx_don_loc;
DEALLOCATE PREPARE stmt_idx_don_loc;

SET @has_idx_ngo_loc := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'ngo_profiles'
    AND index_name = 'idx_ngo_profile_location'
);
SET @sql_idx_ngo_loc := IF(
  @has_idx_ngo_loc = 0,
  'CREATE INDEX idx_ngo_profile_location ON ngo_profiles(latitude, longitude)',
  'SELECT "idx_ngo_profile_location already exists"'
);
PREPARE stmt_idx_ngo_loc FROM @sql_idx_ngo_loc;
EXECUTE stmt_idx_ngo_loc;
DEALLOCATE PREPARE stmt_idx_ngo_loc;

SET @has_idx_notif := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'notification_logs'
    AND index_name = 'idx_notif_donation'
);
SET @sql_idx_notif := IF(
  @has_idx_notif = 0,
  'CREATE INDEX idx_notif_donation ON notification_logs(donation_id)',
  'SELECT "idx_notif_donation already exists"'
);
PREPARE stmt_idx_notif FROM @sql_idx_notif;
EXECUTE stmt_idx_notif;
DEALLOCATE PREPARE stmt_idx_notif;
