SET @has_ngo_name := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'ngo_name'
);

SET @sql_add_ngo_name := IF(
  @has_ngo_name = 0,
  'ALTER TABLE users ADD COLUMN ngo_name VARCHAR(180) NULL AFTER role',
  'SELECT "ngo_name already exists"'
);

PREPARE stmt_add_ngo_name FROM @sql_add_ngo_name;
EXECUTE stmt_add_ngo_name;
DEALLOCATE PREPARE stmt_add_ngo_name;
