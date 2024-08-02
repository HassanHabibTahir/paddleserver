import axios from "axios";
import dotenv from "dotenv";
import fetch from "node-fetch";
import InstagramUser from "../models/instaUserModel.js";
import User from "../models/user.js";
dotenv.config();

export const instagramCallback = async (req, res, userId) => {
  const code = req.query.code;

  console.log(code, "code---->");
  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    const response = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `https://node-vyral-website-drab.vercel.app/auth/instagram/callback`,
        code: code,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // res.json(response.data);

    const { access_token } = response.data;
    console.log("Access Token:", access_token);

    const userDataResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
    );

    if (!userDataResponse.ok) {
      throw new Error(
        `Failed to fetch user data: ${userDataResponse.statusText}`
      );
    }
    const userData = await userDataResponse.json();
    const getLongLivedAccessToken = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.Instagram_APP_SECRET}&access_token=${access_token}`
    );
    console.log(
      getLongLivedAccessToken.data.access_token,
      "getLongLivedAccessToken",
      userData,
      "userData",
      userId
    );

    const instagramUser = new InstagramUser({
      user: userId,
      instagramId: userData.id,
      instagramUsername: userData.username,
      accessToken: getLongLivedAccessToken.data.access_token,
    });
    if (instagramUser) {
      await User.findByIdAndUpdate(userId, {
        $push: { socialMedia: "instagram" },
      });
    }
    console.log(instagramUser, "instagramUser");

    await instagramUser.save();

    res.redirect(
      process.env.IN_PROD === "true"
        ? "https://vyral-website.vercel.app/dashboard/accounts"
        : "http://localhost:3000/dashboard/accounts"
    );
  } catch (error) {
    console.error("Error during OAuth process:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const debugInstagramToken = async (req, res) => {
  try {
    const user = req.user;
    const inUser = await InstagramUser.findOne({ user: user._id }).select(
      "accessToken"
    );
    if (!inUser) {
      return res
        .status(400)
        .json({ message: "Please connect your insta account" });
    }
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username&access_token=${inUser.accessToken}`
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).send("Internal Server Error");
    console.error("Error during token debugging:", error);
  }
};
