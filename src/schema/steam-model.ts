import mongoose from "mongoose";

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

const Streams =
  mongoose.models?.Stream || mongoose.model("Stream", StreamModel);

export default Streams;
