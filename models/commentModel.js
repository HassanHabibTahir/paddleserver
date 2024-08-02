import { Schema, model } from "mongoose";

const comment = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    facebookUserId: {
      type: Schema.Types.ObjectId,
      ref: "FacebookUser",
    },
    commentId: { type: String, required: true, unique: true },
    pageId: { type: String, required: true },
    parentId: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Comment", comment);
