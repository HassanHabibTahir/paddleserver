import { Schema, model } from "mongoose";

const instaUser = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    instagramId: {
      type: String,
      required: true,
    },
    instagramUsername: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("InstaUser", instaUser);
