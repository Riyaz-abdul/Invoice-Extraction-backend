// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// // Connect to SQL Server and create table if needed
// require("./db");

// // Routes
// const invoiceRoutes = require("./routes/invoiceRoutes");

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json()); // for JSON bodies

// // API Routes
// app.use("/invoice", invoiceRoutes);

// // Health check endpoint (optional)
// app.get("/", (req, res) => {
//   res.send("Invoice API is running ✅");
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./db");
const invoiceRoutes = require("./routes/invoiceRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const fieldRoutes = require("./routes/fieldRoutes");


const app = express();

// FIX: Wide-open CORS for testing
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/invoice", invoiceRoutes);
app.use("/vendor", vendorRoutes);
app.use("/fields", fieldRoutes);

app.get("/", (req, res) => {
  res.send("Invoice API is running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));





// const express = require("express");
// const app = express();
// require("dotenv").config();
// require("./db"); // SQL Server connection

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
