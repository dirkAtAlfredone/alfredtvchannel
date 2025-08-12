const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");
const { Agent } = require("https");

const DB = process.env.DB;
const UISP_KEY = process.env.UISP_KEY;
const API_URL = process.env.UISP_URL;

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

app.get("/user/:id", async (req, res) => {
    try{
        const headers = {
            "X-Auth-App-Key": UISP_KEY
        };
        const httpsAgent = new Agent({
            rejectUnauthorized: false
        });
        const {data: subscriptions} = await axios.get(`${API_URL}/api/v1.0/clients/services?clientId=${req.params.id}`, {headers, httpsAgent});
        const {data: client} = await axios.get(`${API_URL}/api/v1.0/clients/${req.params.id}`, {headers, httpsAgent});
        const channelSubscriptions = subscriptions.filter(subscription => subscription.name === 'ALFRED TV | Canada Channel Line Up');
        if(channelSubscriptions.length !== 0){
            const user = {
                firstName: client.firstName,
                lastName: client.lastName,
                organizationName: client.organizationName
            };
            res.status(200).json(user);
        }
        else {
            res.status(400).json({
                message: "No channel subscription..."
            });
        }
    }
    catch(e){
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
})

app.listen(3002, () => {
    console.log("Started in port 3002...");
});