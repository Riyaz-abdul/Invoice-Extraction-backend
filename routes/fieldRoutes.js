const express = require("express");
const router = express.Router();

const {
  createField,
  getAllFields,
  deleteField
} = require("../controllers/fieldController");

// Create field
router.post("/create_field", createField);

// Get all fields
router.post("/all", getAllFields);

// Delete field
router.post("/delete", deleteField);

module.exports = router;
