import { Schema, model } from "mongoose";

const facebookPages = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    facebookUserId: {
      type: Schema.Types.ObjectId,
      ref: "FacebookUser",
    },
    pageId: {
      type: String,
      required: true,
    },
    connectWithPlatform: {
      type: Boolean,
      default: false,
    },
    pageName: {
      type: String,
      required: true,
    },
    picture: {},
    accessToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("FacebookPages", facebookPages);
