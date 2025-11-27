const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerConfig");
const { createInvoice, getInvoices, getInvoiceById } = require("../controllers/invoiceController");

router.post("/", upload.single("pdf"), createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);

module.exports = router;
