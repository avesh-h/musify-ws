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

    // Check if the streams array already has items
    const space = await Spaces.findById(spaceId);

    //TODO: throw error if space not found!

    // Prepare the update object
    const updateFields: any = {
      $push: { streams: createdStream?._id },
    };

    // If the streams array was empty, set currentVideo to the new stream ID
    if (space.streams.length === 0) {
      updateFields.currentVideo = createdStream._id;
    }

    // Add the new stream to the streams array and conditionally set currentVideo
    await Spaces.findByIdAndUpdate(spaceId, updateFields, { new: true });

    if (createdStream) {
      // emit event in the room of the space id for added song.
      io.in(spaceId).emit("added_stream", createdStream);
    }
  });

  //Upvotes handler
  socket.on("upvote_stream", async (payload) => {
    const { spaceId, streamId, userId } = payload;
    const stream = await Streams.findOne({
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

    const updatedStream = await Streams.findOneAndUpdate(
      { _id: streamId, spaceId },
      updateQuery,
      { new: true }
    );
    // Get all streams from space and manipulate the index of it based on no. of upvotes on each stream
    // send updated space streams by emit here
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
