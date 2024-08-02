import Mailgun from "mailgun.js";
import formData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const DOMAIN = process.env.MAILGUN_DOMAIN;
const API_KEY = process.env.MAILGUN_API_KEY;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: "api", key: API_KEY });

export default mg;
