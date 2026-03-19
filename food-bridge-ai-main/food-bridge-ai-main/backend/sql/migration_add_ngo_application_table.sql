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

CREATE INDEX idx_ngo_app_donation ON ngo_food_applications(donation_id);
