const axios = require("axios");
const FormData = require("form-data");
const { getPool, sql } = require("../db");
const { uploadToBlob } = require("../azureBlob");

// ------------------------------------------------------
// 1️⃣ CREATE INVOICE
// ------------------------------------------------------
exports.createInvoice = async (req, res) => {
  try {
    console.log("✅ /invoice API HIT");

    const { body, file } = req;

    console.log("👉 BODY:", body);
    console.log("👉 FILE EXISTS:", !!file);

    if (file) {
      console.log("👉 FILE NAME:", file.originalname);
      console.log("👉 FILE TYPE:", file.mimetype);
      console.log("👉 FILE SIZE:", file.size);
    }

    if (!file) {
      console.error("❌ FILE IS MISSING");
      return res.status(400).json({ message: "PDF file is required." });
    }

    if (!body.country) {
      console.error("❌ COUNTRY IS MISSING");
      return res.status(400).json({ message: "Country is required." });
    }

    // 1. Upload PDF to Azure Blob
    console.log("➡️ Uploading PDF to Azure Blob...");
    const fileUrl = await uploadToBlob(
      file.buffer,
      file.originalname,
      file.mimetype
    );
    console.log("✅ Uploaded to Blob:", fileUrl);

    const fileName = file.originalname;

    // 2. Prepare external API request
    console.log("➡️ Preparing external invoice API request...");
    const formData = new FormData();
    formData.append("pdf", file.buffer, file.originalname);
    formData.append("vendor", body.vendor || "Default Vendor");
    formData.append("country", body.country);

    // 3. Call external invoice extraction API
    console.log("➡️ Calling external invoice extraction API...");
    const apiResponse = await axios.post(
      "https://invoice-service.peolgenai.com/accountspayable",
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      }
    );

    console.log("✅ External API response received");

    const { headers = {}, line_items = [] } = apiResponse.data;
    console.log("👉 Headers keys:", Object.keys(headers));
    console.log("👉 Line Items Count:", line_items.length);

    // 4. Save processed data into SQL Server
    console.log("➡️ Connecting to SQL Server...");
    const pool = await getPool();
    console.log("✅ SQL Server connected");

    console.log("➡️ Saving invoice into database...");
    const result = await pool
      .request()
      .input("PdfBlobUrl", sql.NVarChar, fileUrl)
      .input("PdfFileName", sql.NVarChar, fileName)
      .input("Vendor", sql.NVarChar, body.vendor || "Default Vendor")
      .input("Country", sql.NVarChar, body.country)
      .input(
        "SaveMetadata",
        sql.Bit,
        body.save_metadata === "true" || body.save_metadata === true
      )
      .input(
        "VisionHeader",
        sql.Bit,
        body.vision_header === "true" || body.vision_header === true
      )
      .input(
        "VisionItem",
        sql.Bit,
        body.vision_item === "true" || body.vision_item === true
      )
      .input("Status", sql.NVarChar, body.status || "Needs Review")
     .input("Headers", sql.NVarChar(sql.MAX), JSON.stringify(headers))
.input("LineItems", sql.NVarChar(sql.MAX), JSON.stringify(line_items))

      .query(`
        INSERT INTO test1_Invoice 
        (PdfBlobUrl, PdfFileName, Vendor, Country, SaveMetadata, VisionHeader, VisionItem, Status, Headers, LineItems)
        OUTPUT INSERTED.Id
        VALUES (@PdfBlobUrl, @PdfFileName, @Vendor, @Country, @SaveMetadata, @VisionHeader, @VisionItem, @Status, @Headers, @LineItems)
      `);

    const insertedId = result.recordset[0].Id;
    console.log("✅ Invoice saved successfully. ID:", insertedId);

    return res.status(201).json({
      message: "Invoice successfully processed and saved.",
      invoiceId: insertedId,
      fileUrl,
      headers,
      line_items,
    });
  } catch (error) {
    console.error("❌ INVOICE PROCESSING ERROR");
    console.error(error);

    if (error.response) {
      console.error("❌ External API Error Response:", error.response.data);
      return res.status(error.response.status).json({
        message: "Invoice API error",
        details: error.response.data,
      });
    }

    return res.status(500).json({
      message: "Failed to process invoice.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// 2️⃣ GET ALL INVOICES
// ------------------------------------------------------
exports.getInvoices = async (req, res) => {
  try {
    console.log("✅ GET /invoice hit");

    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        Id, PdfBlobUrl, PdfFileName, Vendor, Country,
        SaveMetadata, VisionHeader, VisionItem, Status,
        CreatedAt, UpdatedAt
      FROM test1_Invoice
      ORDER BY CreatedAt DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    return res.status(500).json({
      message: "Failed to fetch invoices.",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
// 3️⃣ GET INVOICE BY ID
// ------------------------------------------------------
exports.getInvoiceById = async (req, res) => {
  try {
    console.log("✅ GET /invoice/:id hit");

    const { id } = req.params;
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Id", sql.UniqueIdentifier, id)
      .query(`SELECT * FROM test1_Invoice WHERE Id = @Id`);

    if (result.recordset.length === 0) {
      console.warn("⚠️ Invoice not found:", id);
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("❌ Error fetching invoice by ID:", error);
    return res.status(500).json({
      message: "Failed to fetch invoice.",
      error: error.message,
    });
  }
};






//----------------------------------------------------------------------------
// const axios = require("axios");
// const FormData = require("form-data");
// const { getPool, sql } = require("../db");
// const { uploadToBlob } = require("../azureBlob");

// // ------------------------------------------------------
// // 1️⃣ CREATE INVOICE
// // ------------------------------------------------------
// exports.createInvoice = async (req, res) => {
//   try {
//     console.log("I am hitted");

//     const { body, file } = req;

//     if (!file) return res.status(400).json({ message: "PDF file is required." });
//     if (!body.country) return res.status(400).json({ message: "Country is required." });

//     // 1. Upload PDF to Azure Blob
//     const fileUrl = await uploadToBlob(file.buffer, file.originalname, file.mimetype);
//     const fileName = file.originalname;

//     // 2. Prepare external API request
//     const formData = new FormData();
//     formData.append("pdf", file.buffer, file.originalname);
//     formData.append("vendor", body.vendor || "Default Vendor");
//     formData.append("country", body.country);

//     // 3. Call external invoice extraction API
//     const apiResponse = await axios.post(
//       "https://invoice-service.peolgenai.com/accountspayable",
//       formData,
//       {
//         headers: formData.getHeaders(),
//         maxBodyLength: Infinity,
//       }
//     );

//     const { headers = {}, line_items = [] } = apiResponse.data;
//     console.log("Line Items Count:", line_items.length);

//     // 4. Save processed data into SQL Server
//     const pool = await getPool();

//     const result = await pool.request()
//       .input("PdfBlobUrl", sql.NVarChar, fileUrl)
//       .input("PdfFileName", sql.NVarChar, fileName)
//       .input("Vendor", sql.NVarChar, body.vendor || "Default Vendor")
//       .input("Country", sql.NVarChar, body.country)
//       .input("SaveMetadata", sql.Bit, body.save_metadata === "true" || body.save_metadata === true)
//       .input("VisionHeader", sql.Bit, body.vision_header === "true" || body.vision_header === true)
//       .input("VisionItem", sql.Bit, body.vision_item === "true" || body.vision_item === true)
//       .input("Status", sql.NVarChar, body.status || "Needs Review")
//       .input("Headers", sql.NVarChar, JSON.stringify(headers))
//       .input("LineItems", sql.NVarChar, JSON.stringify(line_items))
//       .query(`
//         INSERT INTO test1_Invoice 
//         (PdfBlobUrl, PdfFileName, Vendor, Country, SaveMetadata, VisionHeader, VisionItem, Status, Headers, LineItems)
//         OUTPUT INSERTED.Id
//         VALUES (@PdfBlobUrl, @PdfFileName, @Vendor, @Country, @SaveMetadata, @VisionHeader, @VisionItem, @Status, @Headers, @LineItems)
//       `);

//     const insertedId = result.recordset[0].Id;

//     return res.status(201).json({
//       message: "Invoice successfully processed and saved.",
//       invoiceId: insertedId,
//       fileUrl,
//       headers,
//       line_items,
//     });

//   } catch (error) {
//     console.error("Invoice processing error:", error);

//     if (error.response) {
//       return res.status(error.response.status).json({
//         message: "Invoice API error",
//         details: error.response.data,
//       });
//     }

//     return res.status(500).json({
//       message: "Failed to process invoice.",
//       error: error.message,
//     });
//   }
// };

// // ------------------------------------------------------
// // 2️⃣ GET ALL INVOICES
// // ------------------------------------------------------
// exports.getInvoices = async (req, res) => {
//   try {
//     const pool = await getPool();

//     const result = await pool.request().query(`
//       SELECT 
//         Id, PdfBlobUrl, PdfFileName, Vendor, Country,
//         SaveMetadata, VisionHeader, VisionItem, Status,
//         CreatedAt, UpdatedAt
//       FROM test1_Invoice
//       ORDER BY CreatedAt DESC
//     `);

//     return res.status(200).json(result.recordset);

//   } catch (error) {
//     console.error("Error fetching invoices:", error.message);
//     return res.status(500).json({
//       message: "Failed to fetch invoices.",
//       error: error.message,
//     });
//   }
// };

// // ------------------------------------------------------
// // 3️⃣ GET INVOICE BY ID
// // ------------------------------------------------------
// exports.getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const pool = await getPool();

//     const result = await pool.request()
//       .input("Id", sql.UniqueIdentifier, id)
//       .query(`
//         SELECT * FROM test1_Invoice WHERE Id = @Id
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     return res.status(200).json(result.recordset[0]);

//   } catch (error) {
//     console.error("Error fetching invoice by ID:", error.message);
//     return res.status(500).json({
//       message: "Failed to fetch invoice.",
//       error: error.message,
//     });
//   }
// };



//this is changed

// const axios = require("axios");
// const FormData = require("form-data");
// const sql = require("mssql");
// const { uploadToBlob } = require("../azureBlob");

// exports.createInvoice = async (req, res) => {
//   try {
//     console.log("I am hitted");
//     const { body, file } = req;

//     if (!file) return res.status(400).json({ message: "PDF file is required." });
//     if (!body.country) return res.status(400).json({ message: "Country is required." });

//     // 1️⃣ Upload PDF to Azure 
//     const fileUrl = await uploadToBlob(file.buffer, file.originalname, file.mimetype);
//     const fileName = file.originalname;

//     // 2️⃣ Send to external API
//     const formData = new FormData();



// formData.append("pdf", file.buffer, file.originalname);
// formData.append("vendor", body.vendor || "Default Vendor");
// formData.append("country", body.country);



    

//     const apiResponse = await axios.post(
//       "https://invoice-service.peolgenai.com/accountspayable",
//       formData,
//       { headers: formData.getHeaders(), maxBodyLength: Infinity  }
//     );

//     const { headers = {}, line_items = [] } = apiResponse.data;
//    console.log("Line Items Count:", line_items.length);
//     // 3️⃣ Save to SQL Server
//     const pool = await sql.connect();
//     const result = await pool.request()
//       .input("PdfBlobUrl", sql.NVarChar, fileUrl)
//       .input("PdfFileName", sql.NVarChar, fileName)
//       .input("Vendor", sql.NVarChar, body.vendor || "Default Vendor")
//       .input("Country", sql.NVarChar, body.country)
//       .input("SaveMetadata", sql.Bit, body.save_metadata === "true" || body.save_metadata === true)
//       .input("VisionHeader", sql.Bit, body.vision_header === "true" || body.vision_header === true)
//       .input("VisionItem", sql.Bit, body.vision_item === "true" || body.vision_item === true)
//       .input("Status", sql.NVarChar, body.status || "Needs Review")
//       .input("Headers", sql.NVarChar, JSON.stringify(headers))
//       .input("LineItems", sql.NVarChar, JSON.stringify(line_items))
//       .query(`
//         INSERT INTO test1_Invoice 
//         (PdfBlobUrl, PdfFileName, Vendor, Country, SaveMetadata, VisionHeader, VisionItem, Status, Headers, LineItems)
//         OUTPUT INSERTED.Id
//         VALUES (@PdfBlobUrl, @PdfFileName, @Vendor, @Country, @SaveMetadata, @VisionHeader, @VisionItem, @Status, @Headers, @LineItems)
//       `);

//     const insertedId = result.recordset[0].Id;

//     res.status(201).json({
//       message: "Invoice successfully processed and saved.",
//       invoiceId: insertedId,
//       fileUrl,
//       headers,
//       line_items,
//     });

//   } catch (error) {
//     console.error("Invoice processing error:", error);

//     if (error.response) {
//       return res.status(error.response.status).json({
//         message: "Invoice API error",
//         details: error.response.data,
//       });
//     }

//     res.status(500).json({
//       message: "Failed to process invoice.",
//       error: error.message,
//     });
//   }
// };



// exports.createInvoice = async (req, res) => {
//   try {
//     console.log("I am hitted");
//     const { body, file } = req;

//     // 🔹 Basic validations
//     if (!file) {
//       return res.status(400).json({ message: "PDF file is required." });
//     }
//     if (!body.country) {
//       return res.status(400).json({ message: "Country is required." });
//     }

//     // 🔹 Hard-coded flags (user will NOT send these)
//     const saveMetadata = true;
//     const visionHeader = true;
//     const visionItem = true;

//     // 1️⃣ Upload PDF to Azure
//     const fileUrl = await uploadToBlob(
//       file.buffer,
//       file.originalname,
//       file.mimetype
//     );
//     const fileName = file.originalname;

//     // 2️⃣ Send to external API
//     const formData = new FormData();

//     formData.append("pdf", file.buffer, file.originalname);
//     formData.append("vendor", body.vendor || "Default Vendor");
//     formData.append("country", body.country);

//     // send as "true" to external service
//     formData.append("save_metadata", "true");
//     formData.append("vision_header", "true");
//     formData.append("vision_item", "true");

//     const apiResponse = await axios.post(
//       "https://invoice-service.peolgenai.com/accountspayable",
//       formData,
//       {
//         headers: formData.getHeaders(),
//         maxBodyLength: Infinity,
//         timeout: 300000,
//       }
//     );

//     const { headers = {}, line_items = [] } = apiResponse.data;
//     console.log("Line Items Count:", line_items.length);

//     // 3️⃣ Save to SQL Server
//     const pool = await sql.connect();
//     const result = await pool
//       .request()
//       .input("PdfBlobUrl", sql.NVarChar, fileUrl)
//       .input("PdfFileName", sql.NVarChar, fileName)
//       .input("Vendor", sql.NVarChar, body.vendor || "Default Vendor")
//       .input("Country", sql.NVarChar, body.country)
//       .input("SaveMetadata", sql.Bit, saveMetadata) // always true
//       .input("VisionHeader", sql.Bit, visionHeader) // always true
//       .input("VisionItem", sql.Bit, visionItem)     // always true
//       .input("Status", sql.NVarChar, body.status || "Needs Review")
//       .input("Headers", sql.NVarChar, JSON.stringify(headers))
//       .input("LineItems", sql.NVarChar, JSON.stringify(line_items))
//       .query(`
//         INSERT INTO test1_Invoice 
//         (PdfBlobUrl, PdfFileName, Vendor, Country, SaveMetadata, VisionHeader, VisionItem, Status, Headers, LineItems)
//         OUTPUT INSERTED.Id
//         VALUES (@PdfBlobUrl, @PdfFileName, @Vendor, @Country, @SaveMetadata, @VisionHeader, @VisionItem, @Status, @Headers, @LineItems)
//       `);

//     const insertedId = result.recordset[0].Id;

//     res.status(201).json({
//       message: "Invoice successfully processed and saved.",
//       invoiceId: insertedId,
//       fileUrl,
//       headers,
//       line_items,
//       save_metadata: saveMetadata,
//       vision_header: visionHeader,
//       vision_item: visionItem,
//     });
//   } catch (error) {
//     console.error("Invoice processing error:", error);

//     if (error.response) {
//       return res.status(error.response.status).json({
//         message: "Invoice API error",
//         details: error.response.data,
//       });
//     }

//     res.status(500).json({
//       message: "Failed to process invoice.",
//       error: error.message,
//     });
//   }
// };
// 4️⃣ Fetch all invoices
exports.getInvoices = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query("SELECT * FROM test1_Invoice ORDER BY CreatedAt DESC");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoices", error: error.message });
  }
};

// 5️⃣ Fetch invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect();
    const result = await pool.request()
      .input("Id", sql.UniqueIdentifier, id)
      .query("SELECT * FROM test1_Invoice WHERE Id = @Id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Invoice not found" });

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoice", error: error.message });
  }
};
