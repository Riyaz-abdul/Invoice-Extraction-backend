const express = require("express");
const router = express.Router();
const {
  getAllVendors,
  getVendorConfig,
  createVendor,
  deleteVendor,
  updateVendor
} = require("../controllers/vendorController");

router.post("/all", getAllVendors);
router.post("/config", getVendorConfig);
router.post("/create", createVendor);
router.post("/delete", deleteVendor);
router.post("/update", updateVendor);


module.exports = router;
