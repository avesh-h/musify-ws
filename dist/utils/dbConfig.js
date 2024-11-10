"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DB_URI = process.env.DB_URI;
let isConnected = false;
const connectToDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!DB_URI)
        return console.log("Invalid DB URI!");
    if (isConnected) {
        // is already connected
        return console.log("DB is already connected!");
    }
    const db = mongoose_1.default.connection;
    db.on("open", () => {
        console.log("DB is connected!");
    });
    db.on("error", (error) => {
        console.log("DB connection error " + error);
    });
    db.on("disconnected", () => console.log("DB disconnected!"));
    yield mongoose_1.default.connect(DB_URI);
    isConnected = true;
});
exports.default = connectToDB;
// For just close the db connection whenever the process is close.
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connection.close();
        console.log("DB connection closed!");
        process.exit(0);
    }
    catch (error) {
        console.error("Error closing DB connection:", error);
        process.exit(1); // for let know the process that the connection didn't close get error.
    }
}));
