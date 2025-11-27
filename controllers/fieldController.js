const axios = require("axios");

const BASE_URL = "https://invoice-service.peolgenai.com";

exports.createField = async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/create_field`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (error) {
    return res.status(error?.response?.status || 500).json({
      message: "Failed to create field",
      details: error?.response?.data || error.message,
    });
  }
};

exports.getAllFields = async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/get_all_fields`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (error) {
    return res.status(error?.response?.status || 500).json({
      message: "Failed to fetch fields",
      details: error?.response?.data || error.message,
    });
  }
};

exports.deleteField = async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/delete_field`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (error) {
    return res.status(error?.response?.status || 500).json({
      message: "Failed to delete field",
      details: error?.response?.data || error.message,
    });
  }
};
