const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");
const { Agent } = require("https");
const jwt = require("jsonwebtoken");

const DB = process.env.DB;
const UISP_KEY = process.env.UISP_KEY;
const API_URL = process.env.UISP_URL;
const JWT_SECRET = process.env.JWT_SECRET;

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
                organizationName: client.organizationName,
                subscriptionIds: channelSubscriptions.map(subs => subs.id),
                clientId: client.id
            };

            const token = jwt.sign(user, JWT_SECRET, {expiresIn: "10s"});

            res.status(200).json({user, token});
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
});

app.get("/token/validate", (req, res) => {
    try{
        const authorization = req.headers.authorization;
        const token = authorization?.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - currentTime;
        if(timeLeft >= 0){
            res.status(202).json({
                timeLeft,
                token
            });
        }
        else{
            throw new Error("Unhandled Error");
        }
    }
    catch(e){
        // check device details if matches in db
        if(e.name === "TokenExpiredError" && e.message === "jwt expired"){
            const authorization = req.headers.authorization;
            const token = authorization?.split(" ")[1];
            const decoded = jwt.decode(token, JWT_SECRET);
            const { firstName, lastName, organizationName, subscriptionIds } = decoded;

            const matches = true;
            if(matches){
                const newAuth = jwt.sign({ firstName, lastName, organizationName, subscriptionIds }, JWT_SECRET, {expiresIn: "10s"});
                res.status(202).json({
                    token: newAuth,
                    timeLeft: 11
                });
            }
        }
        else{
            res.status(500).json(e);
        }
    }
});

app.listen(3002, () => {
    console.log("Started in port 3002...");
});