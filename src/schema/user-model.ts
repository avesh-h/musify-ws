import mongoose, { Schema, models, model } from "mongoose";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import Spaces from "./space-model";

const UserSchema = new Schema({
  role: { type: String, enum: ["normal", "creator"] },
  userName: String,
  password: String,
  email: String,
  spaces: [{ type: mongoose.Types.ObjectId, ref: "Space" }], //Give default as empty array
});

const Users = models?.Users || model("Users", UserSchema);

export default Users;
