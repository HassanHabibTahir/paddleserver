import aws from "aws-sdk";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import catchAsync from "../middleware/catchAsync.js";
import User from "../models/user.js";
import {
  forgetEmailVerification,
  sendEmailVerification,
} from "../utils/email.js";
import Mailgen from "mailgen";

export const CookieSettings = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const generateTokenAndSaveUser = async (user) => {
  const token = user.tokenGenrate();
  user.token = token;
  await user.save();
  return token;
};

const SES_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

export const singUp = catchAsync(async (req, res) => {
  const { email } = req.body;

  const checkUser = await User.findOne({ email });

  if (checkUser?.verified === false) {
    await User.findByIdAndDelete(checkUser._id);
  }

  if (checkUser?.verified === true) {
    return res.status(400).json({
      message: "User Already Present",
    });
  }

  const createUser = await User.create(req.body);

  createUser.verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 15);
  createUser.verificationCode = Math.floor(100000 + Math.random() * 900000);
  let token = createUser.tokenGenrate();
  res.cookie("vf-tk", token, CookieSettings);
  console.log(token, "token in signup");

  await createUser.save();
  const AWS_SES = new aws.SES(SES_CONFIG);

  sendEmailVerification(createUser);

  if (createUser) {
    return res.status(201).json({
      message: "Check Your Email For Verification Code",
      time: createUser.verificationCodeExpires,
    });
  }
});

export const verificationCode = catchAsync(async (req, res) => {
  let gettoken = req.cookies["vf-tk"];
  const { verificationCode, forgotPassword } = req.body;

  if (!gettoken) {
    return res.status(400).json({
      message: "Invalid Permission",
    });
  }

  const decodedToken = jwt.verify(gettoken, process.env.JWT_SECRET);

  const users = await User.findById(decodedToken._id);

  if (!users) {
    return res.status(400).json({
      message: "Invalid Token",
    });
  }

  if (users.verified && forgotPassword === false) {
    return res.status(400).json({
      message: "User Already Verified",
    });
  }

  const user = await User.findOne({ _id: decodedToken._id });
  if (user.verificationCodeExpires < new Date() && !forgotPassword) {
    return res.status(400).json({
      message: "Verification Code has expired request a new one",
    });
  }

  if (forgotPassword) {
    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({
        message: "Verification Code has expired request a new one",
      });
    }
    if (user.resetPasswordCode !== verificationCode) {
      return res.status(400).json({
        message: "Invalid Verification Code",
      });
    }
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    return res.status(200).json({
      message: "Verification Code is Correct",
    });
  }

  if (user.verificationCode !== verificationCode) {
    return res.status(400).json({
      message: "Invalid Verification Code",
    });
  }
  user.verified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;

  const tokens = user.tokenGenrate();
  res.clearCookie("vf-tk");

  res.cookie("viryal_tk", tokens, CookieSettings);

  await user.save();

  user.password = undefined;

  const { name, email, _id, accountType, createdAt, socialMedia } = user;

  res.status(201).json({
    message: "Register Successfull",
    user: {
      name,
      email,
      _id,
      socialMedia,
      accountType,
      createdAt,
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compareSync(password, user.password))) {
    return res.status(400).json({
      message: "Invalid Email or Password",
    });
  }

  if (!user.verified) {
    const delUser = await User.findByIdAndDelete(user._id);
    return res.status(400).json({
      message: "Invalid Email or Password",
    });
  }

  // Authentication successful, generate token and set cookie
  const token = user.tokenGenrate();

  res.cookie("viryal_tk", token, CookieSettings);

  // Save user changes and prepare response
  user.token = token;
  await user.save();

  // Clear sensitive data before sending response
  user.password = undefined;
  const { name, subscriptionStatus, _id, accountType, createdAt, socialMedia } =
    user;

  res.status(200).json({
    message: "Login Successful",
    user: {
      name,
      email,
      subscriptionStatus,
      socialMedia,
      _id,
      token,
      accountType,
      createdAt,
    },
  });
});

export const getUser = catchAsync(async (req, res) => {
  const user = req.user;

  if (!user.verified) {
    return res.status(500).json({
      message: "User Not Found",
    });
  }

  const { name, email, subscriptionStatus, _id, socialMedia, createdAt,activeStatus } = user;

  res.status(200).json({
    message: "User Found",
    user: {
      name,
      email,
      subscriptionStatus,
      _id,
      socialMedia,
      createdAt,
      activeStatus
    },
  });
});

export const resendCode = catchAsync(async (req, res) => {
  let token = req.cookies["vf-tk"];

  if (!token) {
    return res.status(400).json({
      message: "Invalid Permission",
    });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decodedToken._id);

  if (user.verified && !user.resetPasswordExpires) {
    return res.status(400).json({
      message: "User Already Verified",
    });
  }

  // if (
  //   user.resetPasswordExpires > new Date() ||
  //   user.verificationCodeExpires > new Date()
  // ) {
  //   return res.status(400).json({
  //     message: "Your verification code is not expired Yet",
  //   });
  // }

  let verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 15);
  let verificationCode = Math.floor(100000 + Math.random() * 900000);

  const updateUser = await User.findByIdAndUpdate(
    user._id,
    {
      resetPasswordExpires: verificationCodeExpires,
      resetPasswordCode: verificationCode,
    },
    { new: true }
  );

  if (user.resetPasswordExpires) {
    forgetEmailVerification(updateUser);
  } else {
    sendEmailVerification(updateUser);
  }
  res.status(200).json({
    message: "Resend Code Successfully",
    time: verificationCodeExpires,
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const findEmail = await User.findOne({ email });

  if (!findEmail) {
    return res.status(400).json({
      message: "Invalid Email",
    });
  }

  const verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 15);
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  const updateUser = await User.findByIdAndUpdate(
    findEmail._id,
    {
      resetPasswordExpires: verificationCodeExpires,
      resetPasswordCode: verificationCode,
    },
    { new: true }
  );
  const token = updateUser.tokenGenrate();

  if (!updateUser) {
    return res.status(400).json({
      message: "Invalid Email",
    });
  }

  res.cookie("vf-tk", token, CookieSettings);

  forgetEmailVerification(updateUser);

  res.status(200).json({
    message: "Check Your Email For Verification Code",
    time: verificationCodeExpires,
  });
});

export const loginWithGoogle = catchAsync(async (req, res) => {
  const { email, name } = req.body;

  let user = await User.findOne({ email });

  if (user?.accountType === "local") {
    return res.status(400).json({
      message: "User Already Present",
    });
  }
  if (!user) {
    user = await User.create({
      ...req.body,
      verified: true,
      accountType: "google",
    });
  }

  const token = await generateTokenAndSaveUser(user);

  const { subscriptionStatus, _id, accountType, createdAt } = user;

  res.status(201).json({
    message: "Login Successful",
    user: {
      name,
      email,
      subscriptionStatus,
      _id,
      token,
      accountType,
      createdAt,
    },
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const user = req.user;

  const findUser = await User.findById(user._id).select("+password");
  console.log(findUser, "findUser");

  const { name, companyName, currentPassword, newPassword } = req.body;

  if (currentPassword && newPassword) {
    const isMatch = await bcrypt.compare(currentPassword, findUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    user.password = newPassword;
    await user.save();
  }

  const updates = {};
  if (name) updates.name = name;
  if (companyName) updates.companyName = companyName;

  const updateUser = await User.findByIdAndUpdate(user._id, updates, {
    new: true,
  });

  const { subscriptionStatus, _id, email, createdAt, socialMedia } = updateUser;

  res.status(201).json({
    message: "Profile Updated Successfully",
    user: {
      name: updateUser.name,
      email,
      subscriptionStatus,
      _id,
      createdAt,
      socialMedia,
    },
  });
});

export const addNewPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  let token = req.cookies["vf-tk"];

  if (!token) {
    return res.status(400).json({
      message: "Invalid Permission",
    });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decodedToken._id);

  user.password = password;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;

  res.clearCookie("vf-tk");

  await user.save();

  res.status(200).json({
    message: "Password Updated Successfully",
  });
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie("viryal_tk", CookieSettings);

  res.status(200).json({
    message: "Logout Successfully",
  });
});
