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
        // Check if the streams array already has items
        const space = yield space_model_1.default.findById(spaceId);
        //TODO: throw error if space not found!
        // Prepare the update object
        const updateFields = {
            $push: { streams: createdStream === null || createdStream === void 0 ? void 0 : createdStream._id },
        };
        // If the streams array was empty, set currentVideo to the new stream ID
        if (space.streams.length === 0) {
            updateFields.currentVideo = createdStream._id;
        }
        // Add the new stream to the streams array and conditionally set currentVideo
        yield space_model_1.default.findByIdAndUpdate(spaceId, updateFields, { new: true });
        if (createdStream) {
            // emit event in the room of the space id for added song.
            io.in(spaceId).emit("added_stream", createdStream);
        }
    }));
    //Upvotes handler
    socket.on("upvote_stream", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { spaceId, streamId, userId } = payload;
        try {
            const stream = yield steam_model_1.default.findOne({
                _id: streamId,
                spaceId,
            });
            if (!stream) {
                console.error("Stream not found for the given spaceId and streamId");
                return;
            }
            // Find user that it already voted the song
            const isAlreadyVoted = stream.upvotes.includes(userId);
            const updateQuery = isAlreadyVoted
                ? { $pull: { upvotes: userId } } // Remove vote
                : { $push: { upvotes: userId } }; // Add vote without duplicates
            const updatedStream = yield steam_model_1.default.findOneAndUpdate({ _id: streamId, spaceId }, updateQuery, { new: true });
            // Get all streams from space and manipulate the index of it based on no. of upvotes on each stream
            const space = yield space_model_1.default.findOne({ _id: spaceId }).populate("streams");
            let allStreams = (_a = space.streams) === null || _a === void 0 ? void 0 : _a.filter((s) => String(s._id) !== String(space === null || space === void 0 ? void 0 : space.currentVideo) //for ignore current video from queue
            );
            if (space && ((_b = space === null || space === void 0 ? void 0 : space.streams) === null || _b === void 0 ? void 0 : _b.length)) {
                //NOTE : if stream upvotes length is 0 then sorted via createdDate else sorted with number of votes
                if (allStreams.some((stream) => { var _a; return (_a = stream.upvotes) === null || _a === void 0 ? void 0 : _a.length; })) {
                    // Sort based on the number of upvotes in descending order
                    allStreams.sort((streamA, streamB) => { var _a, _b; return (((_a = streamB.upvotes) === null || _a === void 0 ? void 0 : _a.length) || 0) - (((_b = streamA.upvotes) === null || _b === void 0 ? void 0 : _b.length) || 0); });
                }
                else {
                    // Sort by `createdAt` field if no streams have upvotes
                    allStreams.sort((streamA, streamB) => new Date(streamA.createdAt).getTime() -
                        new Date(streamB.createdAt).getTime());
                }
                //Update the space's stream order
                space.streams = allStreams.map((s) => s._id);
                //added again current video at first position.
                space.streams.unshift(space === null || space === void 0 ? void 0 : space.currentVideo);
                yield space.save();
                const updatedSpace = yield space.populate("streams");
                // send updated space streams by emit here
                // socket.emit("upvoted_streams", updatedSpace?.streams);
                io.in(spaceId).emit("upvoted_streams", updatedSpace === null || updatedSpace === void 0 ? void 0 : updatedSpace.streams);
            }
        }
        catch (error) {
            console.log("errrrrrrrrr", error);
        }
    }));
    //Delete stream handler
    socket.on("delete_stream", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { spaceId, videoId } = payload;
        //Remove song from the space
        // Remove the song from the space's streams array
        const updatedSpace = yield space_model_1.default.findByIdAndUpdate(spaceId, { $pull: { streams: videoId } }, { new: true } // Return the updated document
        );
        const nextVideoIdx = ((_a = updatedSpace === null || updatedSpace === void 0 ? void 0 : updatedSpace.streams) === null || _a === void 0 ? void 0 : _a.findIndex((vidId) => vidId === (updatedSpace === null || updatedSpace === void 0 ? void 0 : updatedSpace.currentVideo))) + 1;
        // Determine the next video for currentVideo
        const currentVideoId = updatedSpace.streams[nextVideoIdx] || null; // Use the next available stream, or null if empty
        // Update the currentVideo in the space document
        yield space_model_1.default.findByIdAndUpdate(spaceId, { currentVideo: currentVideoId });
        //Remove song from the streams collection
        yield steam_model_1.default.findByIdAndDelete(videoId);
        const space = yield (updatedSpace === null || updatedSpace === void 0 ? void 0 : updatedSpace.populate("streams"));
        const response = {
            nextVideoId: updatedSpace.streams[nextVideoIdx],
            streams: space === null || space === void 0 ? void 0 : space.streams,
        };
        io.in(spaceId).emit("remainning_streams", response);
    }));
    //Pause/Play video controller
    socket.on("video-controller", (event) => {
        io.in(event.spaceId).emit("video-controller", { action: event.action });
    });
    // socket.on("check_room", (data) => {
    //   const sockets = io.sockets.adapter.rooms.get(data?.spaceId);
    //   console.log("ssssssssssssss", sockets);
    // });
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
