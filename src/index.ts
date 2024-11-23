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
    try {
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
      const space = await Spaces.findOne({ _id: spaceId }).populate("streams");

      let allStreams = space.streams?.filter(
        (s: any) => String(s._id) !== String(space?.currentVideo) //for ignore current video from queue
      );

      if (space && space?.streams?.length) {
        //NOTE : if stream upvotes length is 0 then sorted via createdDate else sorted with number of votes

        if (allStreams.some((stream: any) => stream.upvotes?.length)) {
          // Sort based on the number of upvotes in descending order
          allStreams.sort(
            (streamA: any, streamB: any) =>
              (streamB.upvotes?.length || 0) - (streamA.upvotes?.length || 0)
          );
        } else {
          // Sort by `createdAt` field if no streams have upvotes
          allStreams.sort(
            (streamA: any, streamB: any) =>
              new Date(streamA.createdAt).getTime() -
              new Date(streamB.createdAt).getTime()
          );
        }

        //Update the space's stream order
        space.streams = allStreams.map((s: any) => s._id);

        //added again current video at first position.
        space.streams.unshift(space?.currentVideo);

        await space.save();

        const updatedSpace = await space.populate("streams");

        // send updated space streams by emit here
        // socket.emit("upvoted_streams", updatedSpace?.streams);
        io.in(spaceId).emit("upvoted_streams", updatedSpace?.streams);
      }
    } catch (error) {
      console.log("errrrrrrrrr", error);
    }
  });

  //Delete stream handler
  socket.on("delete_stream", async (payload) => {
    const { spaceId, videoId } = payload;

    //Remove song from the space
    // Remove the song from the space's streams array
    const updatedSpace = await Spaces.findByIdAndUpdate(
      spaceId,
      { $pull: { streams: videoId } },
      { new: true } // Return the updated document
    );

    const nextVideoIdx =
      updatedSpace?.streams?.findIndex(
        (vidId: string) => vidId === updatedSpace?.currentVideo
      ) + 1;

    // Determine the next video for currentVideo
    const currentVideoId = updatedSpace.streams[nextVideoIdx] || null; // Use the next available stream, or null if empty

    // Update the currentVideo in the space document
    await Spaces.findByIdAndUpdate(spaceId, { currentVideo: currentVideoId });
    //Remove song from the streams collection
    await Streams.findByIdAndDelete(videoId);

    const space = await updatedSpace?.populate("streams");
    const response = {
      nextVideoId: updatedSpace.streams[nextVideoIdx],
      streams: space?.streams,
    };

    io.in(spaceId).emit("remainning_streams", response);
  });

  //Pause/Play video controller
  socket.on("video-controller", (event) => {
    io.in(event.spaceId).emit("video-controller", { action: event.action });
  });

  // socket.on("check_room", (data) => {
  //   const sockets = io.sockets.adapter.rooms.get(data?.spaceId);
  //   console.log("ssssssssssssss", sockets);
  // });
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
