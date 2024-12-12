const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors"); // Add this line at the top
const bcrypt = require("bcrypt"); // Add bcrypt for password hashing

const app = express();
const port = 8081;
// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "auxiliare_larva",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Exit the process with an error code
  }
  console.log("MySQL connected...");
});

// Update CORS configuration
app.use(
  cors({
    origin: "*", // Temporarily allow all origins
    credentials: true,
  })
);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/register", async (req, res) => {
  const { username, email, password, first_name, last_name, user_type } =
    req.body;

  // Log the received data
  console.log("Received registration data:", {
    username,
    email,
    first_name,
    last_name,
    user_type,
  });

  // Basic validation
  if (
    !username ||
    !email ||
    !password ||
    !first_name ||
    !last_name ||
    !user_type
  ) {
    console.log("Validation failed:", {
      username,
      email,
      first_name,
      last_name,
      user_type,
    });
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const account_status = "active"; // Default account status
    const created_at = new Date();
    const updated_at = new Date();

    const sql =
      "INSERT INTO users (username, email, password, first_name, last_name, user_type, account_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    // Log the SQL query
    console.log("Executing SQL:", sql);

    db.query(
      sql,
      [
        username,
        email,
        hashedPassword,
        first_name,
        last_name,
        user_type,
        account_status,
        created_at,
        updated_at,
      ],
      (err, result) => {
        if (err) {
          console.error("Detailed Database error:", {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState,
          });

          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              success: false,
              message: "Username or email already exists",
            });
          }
          return res.status(500).json({
            success: false,
            message: "Database error occurred: " + err.sqlMessage,
          });
        }
        console.log("Registration successful:", result);
        res.status(200).json({
          success: true,
          message: "User registered successfully",
        });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while hashing password",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something broke on the server!",
  });
});

// Update the listen call at the bottom of the file
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible at http://192.168.1.45:${port}`);
  console.log(
    `For mobile devices, use your computer's IP address: http://192.168.1.45:${port}`
  );
});
