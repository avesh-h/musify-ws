import mongoose from "mongoose";
import Spaces from "./space-model";

const StreamModel = new mongoose.Schema({
  url: String,
  upvotes: {
    type: [{ type: mongoose.Types.ObjectId, ref: "Users" }],
    default: [],
  },
  videoId: String,
  image: String,
  title: String,
  thumbnails: [{ url: String, width: Number, height: Number }],
  spaceId: { type: mongoose.Types.ObjectId, ref: "Space" },
});

// If the stream is first for the space then save stream id as a current video
// StreamModel.post("save", async (savedStream) => {
//   const spaceId = savedStream?.spaceId;
//   // find the streams have lenght in the space
//   const hasLength = await Spaces.find({
//     _id: spaceId,
//     streams: { $not: { $size: 0 } },
//   });

//   if (!hasLength) {
//     await Spaces.findByIdAndUpdate(spaceId, {
//       currentVideo: savedStream?._id,
//     });
//   }
// });

const Streams =
  mongoose.models?.Stream || mongoose.model("Stream", StreamModel);

export default Streams;
