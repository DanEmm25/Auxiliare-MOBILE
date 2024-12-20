const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "auxiliare_larva",
  multipleStatements: true // Ensure multiple statements are allowed for transactions
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Exit the process with an error code
  }
  console.log("MySQL connected...");
});

// Ensure the messages table includes the following fields:
// message_id, sender_id, receiver_id, project_id, message_content, sent_at, is_read, created_at, updated_at

module.exports = db;
