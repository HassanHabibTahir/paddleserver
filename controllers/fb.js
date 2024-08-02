import catchAsync from "../middleware/catchAsync.js";
import facebookUser from "../models/facebookUserModel.js";
import FacebookPages from "../models/facbookPagesModel.js";
import dotenv from "dotenv";
import moment from "moment";
import FB from "fb";
import facebookUserModel from "../models/facebookUserModel.js";
dotenv.config();

export const getFacebookPages = catchAsync(async (req, res, next) => {
  const user = req.user;
  const fbUser = await facebookUser.find({ user: user._id });

  if (fbUser.length === 0) {
    return res
      .status(400)
      .json({ message: "Please connect your facebook account" });
  }

  FB.setAccessToken(fbUser[0].accessToken);
  const check = await checkToken(fbUser[0].accessToken);
  console.log(check, "check");

  FB.api(
    "/me/accounts",
    {
      fields: "name,picture,id,access_token",
    },
    async (response) => {
      console.log(response, "response getFacebookPages file");
      if (response.error) {
        return res.status(400).json({ message: response.error.message });
      }

      const existingPageIds = await FacebookPages.find({
        user: user._id,
      }).select("pageId");
      const existingPageIdSet = new Set(
        existingPageIds.map((page) => page.pageId)
      );

      const addFacebookPagesPromises = response.data
        .filter((page) => {
          return !existingPageIdSet.has(page.id);
        })
        .map(async (page) => {
          const longLivedTokenResponse = await getLongLivedAccessToken(
            page.access_token
          );

          return {
            pageName: page.name,
            picture: page.picture.data.url,
            pageId: page.id,
            facebookUserId: fbUser[0]._id,
            accessToken: longLivedTokenResponse.access_token,
            user: user._id,
          };
        });

      const addFacebookPages = await Promise.all(addFacebookPagesPromises);
      console.log(addFacebookPages, "addFacebookPages");

      if (addFacebookPages.length > 0) {
        try {
          const docs = await FacebookPages.insertMany(addFacebookPages).select(
            "pageName picture pageId picture connectWithPlatform"
          );
          res.status(200).json({ message: "success", data: docs });
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      } else {
        const response = await FacebookPages.find({ user: user._id }).select(
          "pageName picture pageId picture connectWithPlatform"
        );
        res.status(200).json({ message: "success", data: response });
      }
    }
  );
});

export const subscribe = catchAsync(async (req, res, next) => {
  const { pageId } = req.body;
  const getFbPage = await FacebookPages.findOne({ pageId });
  if (!getFbPage) {
    return res.status(400).json({ message: "Page not found" });
  }

  FB.setAccessToken(getFbPage.accessToken);

  FB.api(
    `/${pageId}/subscribed_apps`,
    "POST",
    {
      subscribed_fields: "feed",
    },
    (response) => {
      if (response.error) {
        return res.status(400).json({ message: response.error.message });
      }
      console.log(response, "response subscribe file");

      FB.api(`/${pageId}/subscribed_apps`, async (response) => {
        if (response.error) {
          return res.status(400).json({ message: response.error.message });
        }
        const updatePage = await FacebookPages.findOneAndUpdate(
          { pageId },
          { connectWithPlatform: true },
          { new: true }
        );
        console.log(
          response.data[0].subscribed_fields,
          "response get subscribie file"
        );
        if (response.data[0].subscribed_fields.length === 0) {
          return res.status(400).json({ message: "Subscribe Failed" });
        }
        // console.log(updatePage, "updatePage");
        res.status(200).json({ message: "Subscribed Successfully" });
      });
      // res.status(200).json({ message: "Connect Successfully" });
    }
  );
});

async function getLongLivedAccessToken(accessToken) {
  return new Promise((resolve, reject) => {
    FB.api(
      "/oauth/access_token",
      {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        grant_type: "fb_exchange_token",
        fb_exchange_token: accessToken,
      },
      (response) => {
        if (response.error) {
          reject(response.error);
        }
        resolve(response);
      }
    );
  });
}

const checkToken = async (userAccessToken) => {
  return new Promise((resolve, reject) => {
    FB.api(
      `/debug_token`,
      { input_token: userAccessToken },
      function (response) {
        if (response && !response.error) {
          console.log(response, "response checkToken file");
          if (response.data && response.data.is_valid) {
            console.log("Token is valid");
            resolve(true);
          } else {
            console.log("Token is invalid or expired");
            resolve(false);
          }
        } else {
          reject(response.error || new Error("Unknown error"));
        }
      }
    );
  });
};

export const checkFacebookToken = catchAsync(async (req, res) => {
  const user = req.user;
  const fbUser = await facebookUserModel
    .findOne({ user: user._id })
    .select("accessToken");
  if (!fbUser) {
    return res
      .status(400)
      .json({ message: "Please connect your facebook account" });
  }

  FB.api(
    `/debug_token`,
    {
      input_token: fbUser.accessToken,
      access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
    },
    function (response) {
      if (response && !response.error) {
        if (response.data && response.data.is_valid) {
          console.log("Token is valid");
          return res.status(200).json({ message: "Success" });
        } else {
          return res.status(400).json({ message: "Failed" });
        }
      } else {
        console.log(response.error, "response checkFacebookToken file");
        return res.status(400).json({ message: "Error in response" });
      }
    }
  );
});

export const logoutFacebook = catchAsync(async (req, res) => {
  const user = req.user;
  const fbUser = await facebook
    .findOne({ user: user._id })
    .select("accessToken");
  if (!fbUser) {
    return res
      .status(400)
      .json({ message: "Please connect your facebook account" });
  }

  FB.api(
    `/me/permissions`,
    "DELETE",
    {
      access_token: fbUser.accessToken,
    },
    async function (response) {
      if (response && !response.error) {
        console.log(response, "response logoutFacebook file");
        if (response.success) {
          const fbUser = await facebookUserModel.findOneAndUpdate(
            { user: user._id },
            { accessToken: null }
          );

          if (!fbUser) {
            return res.status(400).json({ message: "Failed" });
          }

          return res.status(200).json({ message: "Success" });
        } else {
          return res.status(400).json({ message: "Failed" });
        }
      } else {
        console.log(response.error, "response logoutFacebook file");
        return res.status(400).json({ message: "Error in response" });
      }
    }
  );
});
