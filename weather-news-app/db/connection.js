const mysql = require('mysql2/promise');
require('dotenv').config();

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'weather_korea',
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: 'utf8mb4'
});

// 실제 연결된 데이터베이스 확인
(async () => {
    try {
        const [rows] = await dbPool.query(`
            SELECT
                DATABASE() AS database_name,
                @@hostname AS host_name,
                @@port AS mysql_port
        `);

        console.log('=================================');
        console.log('MySQL 연결 확인');
        console.log('DB:', rows[0].database_name);
        console.log('Host:', rows[0].host_name);
        console.log('Port:', rows[0].mysql_port);
        console.log('=================================');

    } catch (error) {
        console.error('MySQL 연결 확인 실패:', error.message);
    }
})();

module.exports = dbPool;