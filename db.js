// db.js
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER,
  port: 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let pool;

async function getPool() {
  try {
    if (pool) return pool;

    pool = await sql.connect(config);
    console.log("✅ SQL Server connected");
    return pool;
  } catch (err) {
    console.error("❌ SQL Connection Error:", err.message);
    throw err;
  }
}

module.exports = { sql, getPool };










// const sql = require("mssql");
// require("dotenv").config();

// const config = {
//   server: process.env.DB_SERVER,
//   port: 1433,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   options: {
//     encrypt: true,
//     trustServerCertificate: false,
//   },
// };

// async function connectDB() {
//   try {
//     const pool = await sql.connect(config);
//     console.log("✅ SQL Server connected");

//     // After connection, ensure the table exists
//     await createInvoiceTable(pool);
//   } catch (err) {
//     console.error("❌ Error connecting to SQL Server:", err.message);
//   }
// }

// async function createInvoiceTable(pool) {
//   const query = `
//     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test1_Invoice' AND xtype='U')
//     CREATE TABLE test1_Invoice (
//       Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
//       PdfBlobUrl NVARCHAR(MAX) NOT NULL,
//       PdfFileName NVARCHAR(255),
//       Vendor NVARCHAR(255),
//       Country NVARCHAR(50) NOT NULL,
//       SaveMetadata BIT,
//       VisionHeader BIT,
//       VisionItem BIT,
//       Status NVARCHAR(50) DEFAULT 'Processing',
//       Headers NVARCHAR(MAX),
//       LineItems NVARCHAR(MAX),
//       CreatedAt DATETIME2 DEFAULT GETDATE(),
//       UpdatedAt DATETIME2 DEFAULT GETDATE()
//     );
//   `;
//   await pool.request().query(query);
//   console.log("✅ Ensured table [test1_Invoice] exists");
// }

// connectDB();

// module.exports = sql;






// const sql = require("mssql");
// require("dotenv").config();

// const config = {
//   server: process.env.DB_SERVER,       // e.g., document-digitization.database.windows.net
//   port: 1433,
//   user: process.env.DB_USER,           // e.g., PeolAdmin
//   password: process.env.DB_PASSWORD,   // e.g., $ecurePeol@2025
//   database: process.env.DB_DATABASE,   // e.g., InvoiceAutoDev
//   options: {
//     encrypt: true,
//     trustServerCertificate: false,
//   },
// };

// async function connectDB() {
//   try {
//     await sql.connect(config);
//     console.log("✅ SQL Server connected");
//   } catch (err) {
//     console.error("❌ Error connecting to SQL Server:", err.message);
//   }
// }

// connectDB();
