const axios = require("axios");

const BASE_URL = "https://invoice-service.peolgenai.com";

// 1️⃣ Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/getallvendors`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Vendor API error:", error);

    return res.status(error?.response?.status || 500).json({
      message: "Failed to fetch vendors",
      details: error?.response?.data || error.message,
    });
  }
};

// 2️⃣ Get vendor config
exports.getVendorConfig = async (req, res) => {
  try {
    const { vendor_name } = req.body;

    if (!vendor_name)
      return res.status(400).json({ message: "vendor_name is required" });

    const response = await axios.post(
      `${BASE_URL}/getvendorconfig?vendor_name=${vendor_name}`
    );

    res.json(response.data);
  } catch (error) {
    return res.status(error?.response?.status || 500).json({
      message: "Failed to fetch vendor config",
      details: error?.response?.data || error.message,
    });
  }
};

// 3️⃣ Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const response = await axios.post(`${BASE_URL}/create_vendor`, req.body);
    res.json(response.data);
  } catch (error) {
    return res.status(error?.response?.status || 500).json({
      message: "Failed to create vendor",
      details: error?.response?.data || error.message,
    });
  }
};


// 4️⃣ Delete Vendor
exports.deleteVendor = async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/delete_vendor`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Vendor delete error:", error?.response?.data || error.message);

    return res.status(error?.response?.status || 500).json({
      message: "Failed to delete vendor",
      details: error?.response?.data || error.message,
    });
  }
};


// 5️⃣ Update Vendor
exports.updateVendor = async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/update_vendor`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Vendor update error:", error?.response?.data || error.message);

    return res.status(error?.response?.status || 500).json({
      message: "Failed to update vendor",
      details: error?.response?.data || error.message,
    });
  }
};

