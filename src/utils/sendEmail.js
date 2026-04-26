import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"TickFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    return info; // important
  } catch (error) {
    console.log("Email Error:", error);
    return null;
  }
};

export default sendEmail;