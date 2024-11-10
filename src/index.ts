import dotenv from "dotenv";
import { createServer } from "http";
import connectToDB from "./utils/dbConfig";
import { connectToSocket } from "./utils/socket";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import Streams from "./schema/steam-model";
import Spaces from "./schema/space-model";

// dot env config
dotenv.config();

//DB connection
connectToDB();

const httpServer = createServer();

const io = connectToSocket(httpServer);

io.on("connection", (socket) => {
  //Join space
  socket.on("join_space", async (spaceId) => {
    // create channel with spaceId as name
    socket.join(spaceId);
  });

  //Add song to queue
  socket.on("add_stream", async (payload) => {
    const videoId = payload.videoId;
    const spaceId = payload.spaceId;

    const videoDetails = await getVideoDetails(videoId);

    if (videoDetails) {
      payload.title = videoDetails?.title;
      payload.thumbnails = videoDetails?.thumbnail?.thumbnails;
      // streamObj.smallImg =
      //   thumbnails?.length > 1
      //     ? thumbnails[thumbnails?.length - 2]?.url
      //     : thumbnails[thumbnails?.length - 1]?.url ?? "";
      // streamObj.bigImg = thumbnails[thumbnails?.length - 1]?.url ?? "";
    }

    // Create stream
    // TODO: call youtube search api get the thumnails and images from it and update the stream object.
    const createdStream = new Streams(payload);
    await createdStream.save();

    // Add new stream in streams of space
    await Spaces.findByIdAndUpdate(
      spaceId,
      { $push: { streams: createdStream?._id } },
      { new: true }
    );

    if (createdStream) {
      // emit event in the room of the space id for added song.
      io.in(spaceId).emit("added_stream", createdStream);
    }
  });
});

const getVideoDetails = async (videoId: string) => {
  const videoDetails = await youtubesearchapi?.GetVideoDetails(videoId);
  if (videoDetails) {
    return videoDetails;
  }
  // throw error invalid error
};

//Listen server
httpServer.listen(3001);
