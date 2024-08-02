import express from "express";
import { sendAnswer } from "../controllers/question.js";

import passport from "passport";

export const questionRouter = express.Router();

questionRouter.post(
  "/answer",
  passport.authenticate("jwt", { session: false }),

  sendAnswer
);
