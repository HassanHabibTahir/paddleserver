import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const user = new Schema(
  {
    customerId: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      require: [true, "Email is Required"],
    },
    password: {
      type: String,
      require: ["password is required"],
      select: false,
    },
    socialMedia: [],

    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: 0,
    },

    verificationCodeExpires: {
      type: Date,
    },

    subscriptionStatus: {
      type: String,
      //due to enums its thorWind in login error I check latter
      // enum: ["active","free", "standard", "premium"],
      default: "free",
    },
    activeStatus:{
      type: String,
      enum: ["active", "no-active"],
      default: "no-active",
    },
    customer_id: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
    resetPasswordCode: {
      type: String,
      default: 0,
    },

    resetPasswordExpires: Date,

    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

user.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  return next();
});

user.methods.comparePassword = function async(password) {
  return bcrypt.compareSync(password, this.password);
};

user.methods.tokenGenrate = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1w",
    }
  );
};

export default model("User", user);
