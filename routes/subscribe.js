import express from "express";
import passport from "passport";

import { cancelSubscription, subscribeCheckout } from "../controllers/subscribe.js";

export const subscribeRouter = express.Router();

// subscribeRouter.post(
//   "/payment",
//   passport.authenticate("jwt", { session: false }),
//   subscribe
// );
// subscribeRouter.get(
//   "/",
//   passport.authenticate("jwt", { session: false }),
//   getSubscription
// );

subscribeRouter.get(
  "/cancel-subscription",
  passport.authenticate("jwt", { session: false }),
  cancelSubscription
);

subscribeRouter.post("/webhook", subscribeCheckout);
