"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StreamModel = new mongoose_1.default.Schema({
    url: String,
    upvotes: {
        type: [{ type: mongoose_1.default.Types.ObjectId, ref: "Users" }],
        default: [],
    },
    videoId: String,
    image: String,
    title: String,
    thumbnails: [{ url: String, width: Number, height: Number }],
    spaceId: { type: mongoose_1.default.Types.ObjectId, ref: "Space" },
});
const Streams = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Stream) || mongoose_1.default.model("Stream", StreamModel);
exports.default = Streams;
