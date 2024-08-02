import { Schema, model } from "mongoose";

const facebookUser = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    facebookId: {
      type: String,
      required: true,
    },
    facebookDisplayName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("FacebookUser", facebookUser);
