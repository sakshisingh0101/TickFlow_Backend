// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const sendEmail = async (to, subject, html) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"TickFlow" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html
//     });

//     return info; // important
//   } catch (error) {
//     console.log("Email Error:", error);
//     return null;
//   }
// };

// export default sendEmail;


import dotenv from "dotenv";
dotenv.config();

const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: "ContextIQ", email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("Email Error:", data);
      return null;
    }

    console.log("Email sent:", data);
    return data;
  } catch (error) {
    console.log("Email Error:", error);
    return null;
  }
};

export default sendEmail;