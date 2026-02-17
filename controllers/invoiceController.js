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
// exports.getInvoices = async (req, res) => {
//   try {
//     console.log("✅ GET /invoice hit");

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
//     console.error("❌ Error fetching invoices:", error);
//     return res.status(500).json({
//       message: "Failed to fetch invoices.",
//       error: error.message,
//     });
//   }
// };

exports.getInvoices = async (req, res) => {
  try {
    console.log("✅ GET /invoice hit");

    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        Id, PdfBlobUrl, PdfFileName, Vendor, Country,
        SaveMetadata, VisionHeader, VisionItem, Status,
        Headers, LineItems,     -- ✅ ADD THESE
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

// exports.getInvoices = async (req, res) => {
//   try {
//     console.log("🟢 getInvoices controller entered");

//     const pool = await sql.connect();
//     const result = await pool.request().query("SELECT * FROM test1_Invoice ORDER BY CreatedAt DESC");
//     res.json(result.recordset);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching invoices", error: error.message });
//   }
// };

// // 5️⃣ Fetch invoice by ID
// exports.getInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await sql.connect();
//     const result = await pool.request()
//       .input("Id", sql.UniqueIdentifier, id)
//       .query("SELECT * FROM test1_Invoice WHERE Id = @Id");

//     if (result.recordset.length === 0)
//       return res.status(404).json({ message: "Invoice not found" });

//     res.json(result.recordset[0]);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching invoice", error: error.message });
//   }
// };
