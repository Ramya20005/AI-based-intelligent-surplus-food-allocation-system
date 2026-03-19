SET @has_image_url := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'donations'
    AND column_name = 'image_url'
);

SET @sql_add_image_url := IF(
  @has_image_url = 0,
  'ALTER TABLE donations ADD COLUMN image_url VARCHAR(500) NULL AFTER location',
  'SELECT "image_url column already exists"'
);

PREPARE stmt_add_image_url FROM @sql_add_image_url;
EXECUTE stmt_add_image_url;
DEALLOCATE PREPARE stmt_add_image_url;
