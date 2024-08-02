import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import cors from "cors";
import FB from "fb";
import http from "http";
import { Server } from "socket.io";

import sgMail from "@sendgrid/mail";
import cookieParser from "cookie-parser";
import { Strategy as FacebookStrategy } from "passport-facebook";
// import FacebookUser from "./models/facebookUserModel.js";
import { errorHandler } from "./middleware/ErrorHandler.js";
// import { authRouter } from "./routes/auth.js";
// import FacebookPages from "./models/facbookPagesModel.js";
import passport from "./middleware/Passport.js";
import { subscribeRouter } from "./routes/subscribe.js";

// import User from "./models/user.js";
// import { FBpages } from "./routes/fb.route.js";

// import { instagramRouter } from "./routes/insta.js";
// import { instagramCallback } from "./controllers/insta.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
export const sgMails = sgMail.setApiKey(process.env.EMAIL_KEY);

// app.options("*", cors());

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://vyral-ai.vercel.app",
    "https://vyral-website.vercel.app",
  ],
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
  ],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(limiter);

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use(passport.initialize());

// app.use("/api/v1/user", authRouter);
app.use("/api/v1/paddle-subscribe", subscribeRouter);
// app.use("/api/v1/fbpages", FBpages);
// app.use("/api/v1/insta", instagramRouter);


app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(errorHandler);

// let userId = "";
// app.post("/getUserInfo", async (req, res) => {
//   try {
//     const { id } = req.body;
//     console.log(userId, "userId");
//     userId = id;
//     const findUser = await FacebookUser.findOne({ user: userId });
//     if (!findUser) {
//       res.status(203).json({ message: "User Not Found" });
//       return;
//     }
//     const { _id, user, facebookId } = findUser;
//     return res.status(200).json({ _id, user, facebookId });
//   } catch (error) {
//     res.status(500).send("Internal server error");
//     console.error(error);
//   }
// });

// app.post("/webhook", async (req, res) => {
//   try {
//     const body = req.body;
//     console.log("body", body.entry[0].changes[0]);

//     if (
//       body.entry[0].changes[0].value.item === "comment" &&
//       body.entry[0].changes[0].value.verb === "add"
//     ) {
//       const change = body.entry[0].changes[0].value;
//       const commentID = change.comment_id;
//       const pageId = body.entry[0].id;
//       const parentId = change.parent_id;
//       console.log("Comment ID:", commentID, "parentId:", parentId);
//       const userID = body.entry[0].changes[0].value.from.id;
//       if (userID === pageId) {
//         console.log("Comment from page");
//         return res.status(200).send("EVENT_RECEIVED");
//       }

//       // const findComment = await Comment.findOne({
//       //   commentId: parentId,
//       // });
//       // console.log("findComment", findComment);

//       // if (findComment) {
//       //   console.log("Comment already saved");
//       //   return res.status(200).send("EVENT_RECEIVED");
//       // }

//       const getFbPage = await FacebookPages.findOne({ pageId });

//       if (!getFbPage) {
//         console.log("Page not found for pageId:", pageId);
//         return res.status(404).send("Page not found");
//       }

//       FB.setAccessToken(getFbPage.accessToken);
//       FB.api(
//         `/${parentId}/comments`,
//         "GET",
//         { fields: "message from" },
//         async function (response) {
//           if (response && !response.error) {
//             console.log("Comment response get parent comment :", response);
//           }
//         }
//       );
//       FB.api(
//         `/${commentID}/comments`,
//         "POST",
//         { message: "This is a test comment" },
//         async function (response) {
//           if (response && !response.error) {
//             console.log("Comment response:", response);
//             return res.status(200).send("EVENT_RECEIVED");
//           } else {
//             console.log("Error posting comment:", response.error);
//             return res.status(200).send("EVENT_RECEIVED");
//           }
//         }
//       );
//     } else {
//       return res.status(200).send("ok");
//     }
//   } catch (error) {
//     console.error("Error handling webhook:", error);
//     return res.sendStatus(500);
//   }
// });

// app.get("/webhook", (req, res) => {
//   let VERIFY = "random";
//   let mode = req.query["hub.mode"];
//   let token = req.query["hub.verify_token"];
//   let challenge = req.query["hub.challenge"];
//   if (mode && token) {
//     if (mode === "subscribe" && token === VERIFY) {
//       console.log("WEBHOOK_VERIFIED", challenge, "challenge");
//       res.status(200).send(challenge);
//     } else {
//       res.sendStatus(403);
//     }
//   }
// });

const PORT = 8080;

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: process.env.IN_PROD
//         ? "https://node-vyral-website-drab.vercel.app/auth/facebook/callback"
//         : "http://localhost:8080/auth/facebook/callback",

//       profileFields: ["id", "displayName", "emails"],
//       scope: ["email", "public_profile"],
//     },
//     (accessToken, refreshToken, profile, done) => {
//       // Save accessToken to get pages later
//       console.log(profile, "profile--->", accessToken, "acesss token");
//       const { id, name } = profile._json;

//       return done(null, { id, name, accessToken });
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

// app.use(passport.initialize());

// app.get(
//   "/auth/facebook",
//   passport.authenticate("facebook", {
//     scope: ["email", "public_profile", "pages_show_list"],
//   })
// );

// app.get(
//   "/auth/facebook/callback",
//   passport.authenticate("facebook", { session: false }),
//   async (req, res) => {
//     const { profile, accessToken, id, name } = req.user;
//     console.log(profile, accessToken, "profile, accessToken", id, name);
//     console.log("userId", userId);

//     const facebookUser = new FacebookUser({
//       user: userId,
//       facebookId: id,
//       facebookDisplayName: name,
//       accessToken: accessToken,
//     });

//     await facebookUser.save();

//     if (facebookUser) {
//       const user = await User.findByIdAndUpdate(userId, {
//         $push: { socialMedia: "facebook" },
//       });
//     }
//     console.log("facebookUser", facebookUser);

//     res.redirect(
//       process.env.IN_PROD
//         ? `https://vyral-website.vercel.app/dashboard/accounts?token=${req.user.accessToken}`
//         : `http://localhost:3000/dashboard/accounts?token=${req.user.accessToken}`
//     );
//   }
// );

// app.get("/auth/instagram/callback", async (req, res) => {
//   instagramCallback(req, res, userId);
// });

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

const serverStart = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    const db = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${db.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};





serverStart();

export default app;
