import passport from "passport";
import express from "express";
import { debugInstagramToken } from "../controllers/insta.js";

export const instagramRouter = express.Router();

instagramRouter.get(
  "/check-ig-user",
  passport.authenticate("jwt", { session: false }),
  debugInstagramToken
);
