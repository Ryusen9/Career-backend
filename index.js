const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// Logger Middleware
const logger = (req, res, next) => {
  console.log("Inside the logger");
  next();
};

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

// MongoDB Connection
const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const uri = `mongodb+srv://${user}:${password}@cluster0.q4a9c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const jobCollection = client.db("careerPortal").collection("jobCollection");
    const jobApplicationCollection = client
      .db("careerPortal")
      .collection("job-applications");

    // 🔐 Generate and Set JWT Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // 📝 Get All Jobs
    app.get("/jobs", async (req, res) => {
      console.log("Now inside API callback");
      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    // 📝 Get Job by ID
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await jobCollection.findOne({ _id: new ObjectId(id) });
      result ? res.send(result) : res.status(404).send("No job found.");
    });

    // 📝 Create a Job
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });

    // 📝 Get Job Applications with Job Details
    app.get("/job-application", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await jobApplicationCollection.find(query).toArray();

      //Unprofessional way of connecting application call
      for (const application of result) {
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.category = job.category;
          application.jobType = job.jobType;
        }
      }

      res.send(result);
    });

    // 📝 Get All Job Applications
    app.get("/job-applications", async (req, res) => {
      const result = await jobApplicationCollection.find().toArray();
      res.send(result);
    });

    // 📝 Create a Job Application
    app.post("/job-applications", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
      res.send(result);
    });

    // ❌ Delete Job Application
    app.delete("/job-application/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      if (!job_id) {
        return res.status(400).send({ message: "Job ID is required" });
      }

      const result = await jobApplicationCollection.deleteOne({
        job_id: job_id,
      });
      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Job not found" });
      }

      res.send({
        success: true,
        message: "Job application deleted successfully",
      });
    });
  } finally {
    // Do not close client to keep the connection open
  }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Server is running....");
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
