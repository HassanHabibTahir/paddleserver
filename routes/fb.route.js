import express from "express";

import passport from "passport";
import {
  checkFacebookToken,
  getFacebookPages,
  logoutFacebook,
  subscribe,
} from "../controllers/fb.js";

export const FBpages = express.Router();

FBpages.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getFacebookPages
);

FBpages.get(
  "/check-fb-token",
  passport.authenticate("jwt", { session: false }),
  checkFacebookToken
);
FBpages.post(
  "/subscribe",
  passport.authenticate("jwt", { session: false }),
  subscribe
);

FBpages.get(
  "/disconnect",
  passport.authenticate("jwt", { session: false }),
  logoutFacebook
);
