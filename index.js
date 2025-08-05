const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/ca.m3u", (req, res) => {
    console.log("reached")
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.sendFile(path.join(__dirname, 'ca.m3u'))
})

app.listen(3002, () => {
    console.log("running...");
});