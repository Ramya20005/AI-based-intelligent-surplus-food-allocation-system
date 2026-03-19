CREATE DATABASE IF NOT EXISTS food_bridge;
USE food_bridge;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('donor', 'ngo', 'admin') NOT NULL DEFAULT 'donor',
  ngo_name VARCHAR(180) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  category ENUM('veg', 'nonveg', 'dairy', 'bakery', 'fruits') NOT NULL,
  quantity INT NOT NULL,
  prep_time_note VARCHAR(160) NULL,
  freshness_hours DECIMAL(6,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  location_latitude DECIMAL(10,7) NULL,
  location_longitude DECIMAL(10,7) NULL,
  image_url VARCHAR(500) NULL,
  status ENUM('safe', 'moderate', 'unsafe') NOT NULL,
  risk_score INT NOT NULL,
  safe_time_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  analysis_explanation TEXT NULL,
  locked_by_ngo_id INT NULL,
  locked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_donations_donor FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_donations_ngo FOREIGN KEY (locked_by_ngo_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_donor FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ngo_food_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  ngo_user_id INT NOT NULL,
  applicant_name VARCHAR(120) NOT NULL,
  ngo_name VARCHAR(180) NOT NULL,
  contact_person_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  email VARCHAR(180) NOT NULL,
  collector_name VARCHAR(120) NOT NULL,
  collector_phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ngo_app_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  CONSTRAINT fk_ngo_app_user FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_locked_by ON donations(locked_by_ngo_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_location ON donations(location_latitude, location_longitude);
CREATE INDEX idx_ngo_app_donation ON ngo_food_applications(donation_id);
CREATE INDEX idx_ngo_profile_location ON ngo_profiles(latitude, longitude);
CREATE INDEX idx_notif_donation ON notification_logs(donation_id);
