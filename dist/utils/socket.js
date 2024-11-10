"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToSocket = void 0;
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectToSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        // options
        cors: {
            origin: process.env.URL, // Replace with your Next.js frontend origin
            credentials: true, // Allow cookies if needed
        },
    });
    return io;
};
exports.connectToSocket = connectToSocket;
