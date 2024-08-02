import catchAsync from "../middleware/catchAsync.js";
import subscribeModel from "../models/subscribeModel.js";
import User from "../models/user.js";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
// import Stripe from "stripe";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

// const stripe = new Stripe(
//   "sk_test_51PbKbnRsj2Jj1pv4WLqwZvdF3RlLH1YmTtdHivfj3ZjSwQ9gvRk81ZprzCOf5qECoRLElIExzS918sFQktuSB2CR00vC59P2RY"
// );
// const paddle = new Paddle({
//   vendorId: '21507',
//   apiKey: '613e977d58533c361c86be73f2777e3ec61302d8db136e10f2',
//   environment: 'sandbox', // or 'production'
//   logLevel: 'verbose',
// });
// console.log(paddle)

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
   vendorId: '21507',
  environment: Environment.sandbox,
  logLevel: "verbose",
});
async function getUser(customerId) {
  const productCollection = paddle.customers.list({ id: customerId });
  return productCollection;
}


export const subscribeCheckout = catchAsync(async (req, res, next) => {
  try {
    const { body } = req;
    const priceName = body?.data?.items[0]
    console.log(body?.data?.items[0]?.price?.name);
    // const existingSubscription = await subscribeModel.findOne({
    //   "data.customer_id": body?.data?.customer_id,
    // });
    // if (existingSubscription) {
    //   await subscribeModel.findOneAndUpdate(
    //     { "data.customer_id": body?.data?.customer_id },
    //     body,
    //     { new: true, upsert: false }
    //   );
    // } else {
    //   const subscriptionEvent = new subscribeModel(body);
    //   await subscriptionEvent.save();
    // }
  
    // const productCollection = getUser(body?.data?.customer_id);
    // const firstPage = await productCollection?.next();
    // const customerId = firstPage[0]?.id || body?.data?.customer_id;
    // const customerEmail = firstPage[0]?.email || "";
    // // console.log(body?.data?.customer_id,"body?.data?.customer_id",customerEmail)
    // await subscribeModel.findOneAndUpdate(
    //   { "data.customer_id": customerId },
    //   { email: customerEmail },
    //   { new: true }
    // );
    // await User.findOneAndUpdate(
    //   { email: customerEmail },
    //   { customer_id: customerId, activeStatus: "active",subscriptionStatus:priceName?.price?.name },
    //   { new: true }
    // );
    res.json(body);
  } catch (e) {
    console.error(e);
  }
});

export const cancelSubscription = catchAsync(async (req, res, next) => {
  try {
    const user = req.user;
    const subscriptionData = await subscribeModel.findOne({
      "data.customer_id": user.customer_id,
    });
    const response = await paddle.subscriptions.get(subscriptionData?.data?.id);
    console.log(response)
    // if (response.status === "canceled") {
    //   res.json({ message: "Transactions already cancelled" });
    //   return;
    // }
    // const subscription = await paddle.subscriptions.cancel(
    //   subscriptionData?.data?.id,
    //   { effectiveFrom: "immediately" }
    // );
    // const data = {
    //   id: subscription.id,
    //   status: subscription?.status,
    //   canceled_at: subscription.canceled_at,
    // };
    // await subscribeModel.findOneAndUpdate(
    //   { "data.customer_id": user.customer_id },
    //   data,
    //   { new: true, upsert: false }
    // );
    // await User.findOneAndUpdate(
    //   { customer_id: user?.customer_id },
    //   { activeStatus: "no-active" },
    //   { new: true }
    // );

    res.json({ message: "Cancelled Successfully!" });
  } catch (e) {
    console.log(e);
  }
});

// export const subscribe = catchAsync(async (req, res, next) => {
//   const {
//     paymentMethod,
//     subscriptionType,
//     amount,
//     cardInfo,
//     recurring,
//     address,
//   } = req.body;
//   let paymentIntent;
//   const existingCustomers = await stripe.customers.list({
//     email: req.user.email,
//   });

//   let customerId;
//   let subscription;

//   if (existingCustomers.data.length > 0) {
//     customerId = existingCustomers.data[0].id;
//   } else {
//     const customer = await stripe.customers.create({
//       payment_method: paymentMethod,
//       email: req.user.email,
//       name: req.user.name,
//       address: address,

//       invoice_settings: {
//         default_payment_method: paymentMethod,
//       },
//     });

//     customerId = customer;
//   }

//   if (recurring) {
//     let priceId;
//     if (subscriptionType === "standard") {
//       priceId = "price_1ORv6GLj5nFhqgN0AfI1pWeW";
//     } else if (subscriptionType === "premium") {
//       priceId = "price_1ORv7pLj5nFhqgN0walmTh6a";
//     }
//     subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: priceId }],
//       expand: ["latest_invoice.payment_intent"],
//     });

//     paymentIntent = subscription.latest_invoice.payment_intent;
//   } else {
//     paymentIntent = await stripe.paymentIntents.create({
//       amount: amount * 100,
//       currency: "eur",
//       payment_method: paymentMethod,
//       confirm: true,
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: "never",
//       },
//       customer: customerId,
//     });
//   }

//   const getSubscription = await subscribeModel.findOne({ user: req.user._id });

//   let dbSubscription;
//   if (getSubscription) {
//     dbSubscription = await subscribeModel.findByIdAndUpdate(
//       getSubscription._id,
//       {
//         paymentIntentId: paymentIntent.id,
//         paymentMethod,
//         cardInfo,
//         recurring,
//         subscriptionId: recurring ? subscription.id : "",
//         amount: paymentIntent.amount / 100,
//         status: {
//           active: true,
//           subscriptionType,
//           startDate: new Date(),
//         },
//       },
//       { new: true }
//     );
//   } else {
//     dbSubscription = await subscribeModel.create({
//       user: req.user._id,
//       amount: paymentIntent.amount / 100,
//       cardInfo,
//       paymentMethod,
//       recurring,
//       paymentIntentId: paymentIntent.id,
//       subscriptionId: recurring ? subscription.id : "",
//       status: {
//         active: true,
//         subscriptionType,
//         startDate: new Date(),
//       },
//     });
//   }

//   await User.findByIdAndUpdate(req.user._id, {
//     activeStatus: subscriptionType,
//     creditLimit: req.user.creditLimit + 15,
//   });

//   return res.status(201).json({
//     message: "Payment successful",
//     clientSecret: paymentIntent.client_secret,
//     subscription: dbSubscription,
//   });
// });

// export const subscribeCheckout = catchAsync(async (req, res) => {
//   const { amount, subscriptionName } = req.body;

//   const user = await req.user;
//   console.log(user, "user");

//   const findUser = await User.findById({
//     _id: user.id,
//   });
//   if (!findUser) {
//     return res.status(400).json("Unauthorized");
//   }

//   const existingCustomers = await stripe.customers.list({
//     email: findUser.email,
//   });

//   let customerId;
//   if (existingCustomers.data.length > 0) {
//     customerId = existingCustomers.data[0].id;
//   } else {
//     const customer = await stripe.customers.create({
//       email: findUser.email,
//       name: findUser.name,
//       invoice_settings: {
//         default_payment_method,
//       },
//     });
//     customerId = customer.id;
//   }

//   console.log(customerId, "customerId", amount, subscriptionName);
//   if (customerId) {
//     const session = await stripe.checkout.sessions.create({
//       success_url:
//         process.env.IN_PROD === "production"
//           ? `${process.env.CLIENT_URL_PROD}/success`
//           : `${process.env.CLIENT_URL_DEV}/success`,
//       cancel_url:
//         process.env.IN_PROD === "production"
//           ? `${process.env.CLIENT_URL_PROD}/cancel`
//           : `${process.env.CLIENT_URL_DEV}/cancel`,
//       billing_address_collection: "auto",
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: subscriptionName,
//             },
//             unit_amount: Number(amount) * 100,
//             // unit_amount: 399,
//           },
//           quantity: 1,
//         },
//       ],
//       automatic_tax: {
//         enabled: true,
//       },
//       customer: findUser.email,
//       metadata: {
//         userEmail: findUser.email,
//         amount: amount,
//         subscriptionName: subscriptionName,
//         payment: true,
//       },
//       customer_update: {
//         shipping: "auto",
//       },
//       shipping_address_collection: {
//         allowed_countries: [
//           "US",
//           "CA",
//           "IN",
//           "GB",
//           "AU",
//           "DE",
//           "FR",
//           "IT",
//           "ES",
//           "JP",
//         ],
//       },

//       //   customer_email: findUser.email,
//       customer: customerId,
//     });

//     res.status(200).json({ id: session.id });
//   }
// });

// export const cancelSubscription = catchAsync(async (req, res, next) => {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   const { subscriptionId } = req.body;

//   const dbSubscription = await subscribeModel.findOne({ user: req.user._id });

//   if (dbSubscription && dbSubscription.recurring) {
//     await stripe.subscriptions.cancel(subscriptionId);
//   }

//   const subscription = await subscribeModel.findByIdAndUpdate(
//     dbSubscription._id,
//     {
//       status: {
//         active: false,
//         subscriptionType: "free",
//         cancelDate: new Date(),
//       },
//     }
//   );

//   await User.findByIdAndUpdate(req.user._id, {
//     subscriptionStatus: "free",
//     creditLimit: req.user.creditLimit - 15,
//   });

//   return res.status(200).json({
//     message: "Subscription cancelled",
//     subscription,
//   });
// });

// export const getSubscription = catchAsync(async (req, res, next) => {
//   const dbSubscription = await subscribeModel.findOne({ user: req.user._id });
//   if (!dbSubscription) {
//     return res.status(404).json({
//       message: "Subscription not found",
//     });
//   }
//   return res.status(200).json({
//     message: "Subscription found",
//     subscription: dbSubscription,
//   });
// });

// // export const upgradeSubscription = catchAsync(async (req, res, next) => {
// //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// //   const { subscriptionId, subscriptionType, amount } = req.body;
// //   const subscription = await stripe.subscriptions.update(subscriptionId, {
// //     cancel_at_period_end: false,
// //     items: [
// //       {
// //         id: subscriptionId,
// //         price:
// //           subscriptionType === "standard"
// //             ? "price_1ORv6GLj5nFhqgN0AfI1pWeW"
// //             : "price_1ORv7pLj5nFhqgN0walmTh6a",
// //       },
// //     ],
// //   });

// //   await User.findByIdAndUpdate(req.user._id, {
// //     subscriptionStatus: subscriptionType,
// //     creditLimit: amount,
// //   });

// //   return res.status(200).json({
// //     message: "Subscription upgraded",
// //     subscription,
// //   });
// // });

// export const extractUser = (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };
