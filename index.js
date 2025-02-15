const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(express.json());
app.use(cors());

const user = process.env.DB_USER;
const password = process.env.DB_PASS;


const uri = `mongodb+srv://${user}:${password}@cluster0.q4a9c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const jobCollection = client.db("careerPortal").collection("jobCollection");


    app.get("/jobs", async(req, res) => {
        const cursor = jobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', async(req, res) => {
    res.send("Server is running....");
})

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
})