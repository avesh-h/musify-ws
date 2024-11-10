"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SpaceModel = new mongoose_1.default.Schema({
    spaceName: { type: String },
    creator: { type: mongoose_1.default.Types.ObjectId, ref: "Users" },
    streams: {
        type: [{ type: mongoose_1.default.Types.ObjectId, ref: "Stream" }], //each audio
        default: [],
    },
});
const Spaces = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Space) || mongoose_1.default.model("Space", SpaceModel);
exports.default = Spaces;
