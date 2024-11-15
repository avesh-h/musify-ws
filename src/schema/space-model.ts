import mongoose from "mongoose";

const SpaceModel = new mongoose.Schema({
  spaceName: { type: String },
  creator: { type: mongoose.Types.ObjectId, ref: "Users" },
  streams: {
    type: [{ type: mongoose.Types.ObjectId, ref: "Stream" }], //each audio
    default: [],
  },
  currentVideo: {
    type: mongoose.Schema.Types.Mixed, // Allows flexibility for any type, including ObjectId or null
    ref: "Stream",
    default: null,
  },
});

const Spaces = mongoose.models?.Space || mongoose.model("Space", SpaceModel);

export default Spaces;
