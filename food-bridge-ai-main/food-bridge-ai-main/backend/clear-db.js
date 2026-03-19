import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function clearDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodproject'
  });

  try {
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    console.log('Tables found:', tableNames);

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear each table
    for (const table of tableNames) {
      await connection.query(`TRUNCATE TABLE ${table}`);
      console.log(`Cleared table: ${table}`);
    }

    // Enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('All data cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await connection.end();
  }
}

clearDatabase();
