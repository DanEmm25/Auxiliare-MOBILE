const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // Import the database connection
const jwt = require("jsonwebtoken"); // Add JWT package
const secretKey = "your_secret_key"; // Replace with a secure key

const app = express();
const port = 8081;

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

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Auth Header:", authHeader);
  console.log("Token:", token);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token missing" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    console.log("Decoded user from token:", user);
    req.user = user;
    next();
  });
}

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

app.post("/login", async (req, res) => {
  console.log("Received login request:", req.body);

  const { identifier, password } = req.body;

  // Log the extracted fields
  console.log("Identifier:", identifier);
  console.log("Password:", password);

  // Detailed validation logging
  if (!identifier || !password) {
    console.log("Missing fields:", {
      hasIdentifier: !!identifier,
      hasPassword: !!password,
    });
    return res.status(400).json({
      success: false,
      message: "Email/Username and password are required",
    });
  }

  try {
    const sql = "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1";
    console.log("Executing query with identifier:", identifier);

    db.query(sql, [identifier, identifier], async (err, results) => {
      if (err) {
        console.error("Login query error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error occurred",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const userPayload = {
        id: user.user_id,
        username: user.username,
        user_type: user.user_type,
      };
      const accessToken = jwt.sign(userPayload, secretKey, { expiresIn: "1h" }); // Generate token

      res.status(200).json({
        success: true,
        message: "Login successful",
        userType: user.user_type,
        userData: userPayload,
        token: accessToken, // Send token to client
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
});

app.post("/create-project", authenticateToken, async (req, res) => {
  console.log("User from token:", req.user);
  const user_id = req.user.id;

  if (!user_id) {
    console.error("User ID missing in token payload");
    return res.status(400).json({
      success: false,
      message: "User ID not found in token",
    });
  }

  const { title, description, funding_goal, category, start_date, end_date } =
    req.body;

  // Log the received data
  console.log("Received project data:", {
    user_id,
    title,
    description,
    funding_goal,
    category,
    start_date,
    end_date,
  });

  // Basic validation
  if (
    !title ||
    !description ||
    !funding_goal ||
    !category ||
    !start_date ||
    !end_date
  ) {
    console.log("Validation failed:", {
      title,
      description,
      funding_goal,
      category,
      start_date,
      end_date,
    });
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const sql =
      "INSERT INTO projects (user_id, title, description, funding_goal, category, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const created_at = new Date();
    const updated_at = new Date();

    // Log the SQL query
    console.log("Executing SQL:", sql);

    db.query(
      sql,
      [
        user_id,
        title,
        description,
        funding_goal,
        category,
        start_date,
        end_date,
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
          return res.status(500).json({
            success: false,
            message: "Database error occurred: " + err.sqlMessage,
          });
        }
        console.log("Project creation successful:", result);
        res.status(200).json({
          success: true,
          message: "Project created successfully",
        });
      }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while creating project",
    });
  }
});

app.get("/user-projects/:userId", authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const sql = "SELECT * FROM projects WHERE user_id = ?";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching projects"
      });
    }
    
    res.status(200).json({
      success: true,
      projects: results
    });
  });
});

// Endpoint to fetch all projects
app.get("/projects", authenticateToken, (req, res) => {
  const sql = `
    SELECT p.*, 
           COALESCE(SUM(i.investment_amount), 0) as current_funding,
           COALESCE(COUNT(DISTINCT i.investor_id), 0) as total_investors
    FROM projects p
    LEFT JOIN investments i ON p.id = i.project_id
    GROUP BY p.id`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching projects",
      });
    }

    res.status(200).json({
      success: true,
      projects: results,
    });
  });
});

// Endpoint to fetch a single project by ID
app.get("/projects/:id", authenticateToken, (req, res) => {
  const projectId = req.params.id;
  const sql = `
    SELECT p.*, 
           COALESCE(SUM(i.investment_amount), 0) as current_funding,
           COALESCE(COUNT(DISTINCT i.investor_id), 0) as total_investors
    FROM projects p
    LEFT JOIN investments i ON p.id = i.project_id
    WHERE p.id = ?
    GROUP BY p.id`;

  db.query(sql, [projectId], (err, results) => {
    if (err) {
      console.error("Error fetching project:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching project",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project: results[0],
    });
  });
});

// Update project endpoint
app.put("/update-project/:projectId", authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const projectId = req.params.projectId;
  const { title, description, funding_goal, category, start_date, end_date } = req.body;

  // Basic validation
  if (!title || !description || !funding_goal || !category || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const sqlCheck = "SELECT * FROM projects WHERE id = ? AND user_id = ?";
  db.query(sqlCheck, [projectId, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error occurred",
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const sqlUpdate =
      "UPDATE projects SET title = ?, description = ?, funding_goal = ?, category = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?";
    const updated_at = new Date();

    db.query(
      sqlUpdate,
      [title, description, funding_goal, category, start_date, end_date, updated_at, projectId],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error occurred during update",
          });
        }
        res.status(200).json({
          success: true,
          message: "Project updated successfully",
        });
      }
    );
  });
});

// Delete project endpoint
app.delete("/delete-project/:projectId", authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const projectId = req.params.projectId;

  const sqlCheck = "SELECT * FROM projects WHERE id = ? AND user_id = ?";
  db.query(sqlCheck, [projectId, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error occurred",
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const sqlDelete = "DELETE FROM projects WHERE id = ?";
    db.query(sqlDelete, [projectId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error occurred during deletion",
        });
      }
      res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    });
  });
});

// Get user profile endpoint
app.get("/user-profile", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const sql = "SELECT user_id, username, email, first_name, last_name, user_type FROM users WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching user profile"
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      user: results[0]
    });
  });
});

// Update user profile endpoint
app.put("/update-profile", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, email, first_name, last_name } = req.body;

  // Basic validation
  if (!username || !email || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const sql = `
    UPDATE users 
    SET username = ?, email = ?, first_name = ?, last_name = ?, updated_at = ? 
    WHERE user_id = ?`;

  db.query(
    sql,
    [username, email, first_name, last_name, new Date(), userId],
    (err, result) => {
      if (err) {
        console.error("Update error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: "Username or email already exists"
          });
        }
        return res.status(500).json({
          success: false,
          message: "Error updating profile"
        });
      }
      res.status(200).json({
        success: true,
        message: "Profile updated successfully"
      });
    }
  );
});

// Add an endpoint to fetch dashboard data
app.get("/dashboard-data/:userId", authenticateToken, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get all projects for the user
    const projectsQuery = "SELECT * FROM projects WHERE user_id = ?";
    
    db.query(projectsQuery, [userId], (err, projects) => {
      if (err) {
        console.error("Error fetching dashboard data:", err);
        return res.status(500).json({
          success: false,
          message: "Error fetching dashboard data"
        });
      }

      // Calculate metrics
      const metrics = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => new Date(p.end_date) >= new Date()).length,
        fundedProjects: 0, // You'll need to add a funding status to your projects table
        totalFunding: 0, // You'll need to add a received_funding field to your projects table
      };

      // Get recent projects (last 5)
      const recentProjects = projects
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      res.status(200).json({
        success: true,
        metrics,
        recentProjects
      });
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data"
    });
  }
});

// Get user balance
app.get("/user-balance", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT balance FROM users WHERE user_id = ?";
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching balance"
      });
    }
    res.status(200).json({
      success: true,
      balance: results[0]?.balance || 0
    });
  });
});

// Deposit funds
app.post("/deposit", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid amount"
    });
  }

  const sql = "UPDATE users SET balance = balance + ? WHERE user_id = ?";
  
  db.query(sql, [amount, userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error processing deposit"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Deposit successful"
    });
  });
});

// Get transaction history (simple version)
app.get("/transaction-history", authenticateToken, (req, res) => {
  const userId = req.user.id;
  // You'll need to create a transactions table for this
  // For now, returning mock data
  res.status(200).json({
    success: true,
    transactions: []
  });
});

// Create investment endpoint
app.post("/invest", authenticateToken, async (req, res) => {
  const investor_id = req.user.id;
  const { project_id, investment_amount } = req.body;

  // Validate input
  if (!project_id || !investment_amount || investment_amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid investment details"
    });
  }

  // Start transaction
  db.beginTransaction(async (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Transaction error"
      });
    }

    try {
      // Check user balance
      const balanceQuery = "SELECT balance FROM users WHERE user_id = ?";
      const [balanceResult] = await new Promise((resolve, reject) => {
        db.query(balanceQuery, [investor_id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      if (balanceResult.balance < investment_amount) {
        db.rollback();
        return res.status(400).json({
          success: false,
          message: "Insufficient balance"
        });
      }

      // Create investment record
      const investment_date = new Date();
      const investment_status = "active";
      const investmentQuery = `
        INSERT INTO investments 
        (investor_id, project_id, investment_amount, investment_date, investment_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await new Promise((resolve, reject) => {
        db.query(
          investmentQuery,
          [
            investor_id,
            project_id,
            investment_amount,
            investment_date,
            investment_status,
            investment_date,
            investment_date
          ],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });

      // Update user balance
      const updateBalanceQuery = "UPDATE users SET balance = balance - ? WHERE user_id = ?";
      await new Promise((resolve, reject) => {
        db.query(updateBalanceQuery, [investment_amount, investor_id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      // Commit transaction
      db.commit((err) => {
        if (err) {
          db.rollback();
          return res.status(500).json({
            success: false,
            message: "Error finalizing investment"
          });
        }

        res.status(200).json({
          success: true,
          message: "Investment successful"
        });
      });
    } catch (error) {
      db.rollback();
      console.error("Investment error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing investment"
      });
    }
  });
});

// Get user investments with project details
app.get("/user-investments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT i.*, p.title as project_title 
    FROM investments i 
    JOIN projects p ON i.project_id = p.id 
    WHERE i.investor_id = ? 
    ORDER BY i.investment_date DESC`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching investments:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching investments"
      });
    }
    
    res.status(200).json({
      success: true,
      investments: results
    });
  });
});

// Get user investment summary
app.get("/user-investment-summary", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT 
      COUNT(*) as total_investments,
      SUM(investment_amount) as total_invested,
      COUNT(CASE WHEN investment_status = 'active' THEN 1 END) as active_investments
    FROM investments 
    WHERE investor_id = ?`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching investment summary:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching investment summary"
      });
    }
    
    res.status(200).json({
      success: true,
      summary: {
        totalInvestments: results[0].total_investments || 0,
        totalInvested: results[0].total_invested || 0,
        activeInvestments: results[0].active_investments || 0
      }
    });
  });
});

app.get("/portfolio", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      p.*,
      i.investment_amount,
      (SELECT COALESCE(SUM(investment_amount), 0) 
       FROM investments 
       WHERE project_id = p.id) as current_funding,
      (SELECT COUNT(DISTINCT investor_id) 
       FROM investments 
       WHERE project_id = p.id) as total_investors
    FROM investments i
    JOIN projects p ON i.project_id = p.id
    WHERE i.investor_id = ?
    ORDER BY i.investment_date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching portfolio:", err);
      return res.status(500).json({
        success: false,
        message: "Server error occurred while fetching portfolio",
      });
    }

    res.status(200).json({
      success: true,
      portfolio: results,
    });
  });
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
  console.log(`Server accessible at http://192.168.1.46:${port}`);
  console.log(
    `For mobile devices, use your computer's IP address: http://192.168.1.46:${port}`
  );
});
