const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

app.get('/', async(req, res) => {
    res.send("Server is running....");
})

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
})