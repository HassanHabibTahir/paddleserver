import sgMail from "@sendgrid/mail";
import catchAsync from "../middleware/catchAsync.js";
import { sgMails } from "../index.js";
import dotenv from "dotenv";
dotenv.config();
export const config = {
  development: {
    server: "http://localhost:8080",
    client: "http://localhost:5173",
  },
};
// Set your SendGrid API key

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export const server =
  process.env.IN_PROD === "true"
    ? "http://localhost:8080/api/auth"
    : "http://localhost:8080/api/auth";

const returnHtml = (verifyUrl) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Add your responsive CSS styles here */
    </style>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center;">Email Verification</h1>
        <p style="text-align: center;">Thank you for registering with our service. To verify your email address, Use this code.</p>
        
        <div style="margin-top: 30px; text-align: center;">
        <h1>${verifyUrl}</h1>
            
        </div>
          <div style="margin-top: 20px;">
            <p>
            This code will expire in 15 minutes. 
            
            </p>
        </div>
        <div style="margin-top: 20px;">
            <p>If you did not register an account with us, please disregard this email.</p>
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <p>Thank you for your cooperation.</p>
        </div>
    </div>
</body>
</html>
`;
};
const returnHtmlReset = (verifyUrl) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Add your responsive CSS styles here */
    </style>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center;">Password Reset Email</h1>
        <p style="text-align: center;">Thank you for use  our service. To update your password, please click the button below.</p>
        
        <div style="margin-top: 30px; text-align: center;">
           <h1>${verifyUrl}</h1>
        </div>
         <div style="margin-top: 20px;">
            <p>
            This code will expire in 15 minutes. 
            
            </p>
        </div>
        <div style="margin-top: 20px;">
          <p>If you not want to update password so ignore this Code</p>
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <p>Thank you for your cooperation.</p>
        </div>
    </div>
</body>
</html>
`;
};

export const sendEmailVerification = catchAsync(async (user) => {
  try {
    const verifactionUrl = user?.verificationCode;
    const msg = {
      to: user?.email,
      from: { name: "Vyral AI", email: "wahabnoor315@gmail.com" },
      subject: "Vyral.ai  Email Verification",
      text: `This is the email content ${verifactionUrl}`,
      html: returnHtml(verifactionUrl),
    };

    const send = await sgMails.send(msg);
    console.log(send, "send");
  } catch (err) {
    console.log(err);
  }
});

export const forgetEmailVerification = catchAsync(async (user) => {
  try {
    const verifactionUrl = user?.resetPasswordCode;
    const msg = {
      to: user?.email,
      from: { name: "Virayl AI", email: "wahabnoor315@gmail.com" },
      subject: " Vyral.ai Password Reset Emai",
      text: `This is the email content ${verifactionUrl}`,
      html: returnHtmlReset(verifactionUrl),
    };

    const send = await sgMails.send(msg);
    console.log(send, "send");
  } catch (err) {
    console.log(err);
  }
});
