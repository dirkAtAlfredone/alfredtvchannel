const dotenv = require("dotenv");
dotenv.config()

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const DB = process.env.DB;

const app = express();

app.use(cors());

app.use(express.json());

mongoose.connect(DB);

mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB...");
});

app.get("/ca.m3u", (req, res) => {
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.sendFile(path.join(__dirname, 'ca.m3u'));
});

app.listen(3002, () => {
    console.log("Started in port 3002...");
});