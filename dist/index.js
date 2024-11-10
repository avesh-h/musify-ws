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
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const dbConfig_1 = __importDefault(require("./utils/dbConfig"));
const socket_1 = require("./utils/socket");
//@ts-ignore
const youtube_search_api_1 = __importDefault(require("youtube-search-api"));
const steam_model_1 = __importDefault(require("./schema/steam-model"));
const space_model_1 = __importDefault(require("./schema/space-model"));
// dot env config
dotenv_1.default.config();
//DB connection
(0, dbConfig_1.default)();
const httpServer = (0, http_1.createServer)();
const io = (0, socket_1.connectToSocket)(httpServer);
io.on("connection", (socket) => {
    //Join space
    socket.on("join_space", (spaceId) => __awaiter(void 0, void 0, void 0, function* () {
        // create channel with spaceId as name
        socket.join(spaceId);
    }));
    //Add song to queue
    socket.on("add_stream", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const videoId = payload.videoId;
        const spaceId = payload.spaceId;
        const videoDetails = yield getVideoDetails(videoId);
        if (videoDetails) {
            payload.title = videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.title;
            payload.thumbnails = (_a = videoDetails === null || videoDetails === void 0 ? void 0 : videoDetails.thumbnail) === null || _a === void 0 ? void 0 : _a.thumbnails;
            // streamObj.smallImg =
            //   thumbnails?.length > 1
            //     ? thumbnails[thumbnails?.length - 2]?.url
            //     : thumbnails[thumbnails?.length - 1]?.url ?? "";
            // streamObj.bigImg = thumbnails[thumbnails?.length - 1]?.url ?? "";
        }
        // Create stream
        // TODO: call youtube search api get the thumnails and images from it and update the stream object.
        const createdStream = new steam_model_1.default(payload);
        yield createdStream.save();
        // Add new stream in streams of space
        yield space_model_1.default.findByIdAndUpdate(spaceId, { $push: { streams: createdStream === null || createdStream === void 0 ? void 0 : createdStream._id } }, { new: true });
        if (createdStream) {
            // emit event in the room of the space id for added song.
            io.in(spaceId).emit("added_stream", createdStream);
        }
    }));
});
const getVideoDetails = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const videoDetails = yield (youtube_search_api_1.default === null || youtube_search_api_1.default === void 0 ? void 0 : youtube_search_api_1.default.GetVideoDetails(videoId));
    if (videoDetails) {
        return videoDetails;
    }
    // throw error invalid error
});
//Listen server
httpServer.listen(3001);
