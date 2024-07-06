const { nodemailer, googleapis } = require("../utils/imports.util");
const serverConfig = require("./serverConfig");

const sendEmail = async (email, subject, text) => {
  try {
    const oAuth2Client = new googleapis.google.auth.OAuth2(
      serverConfig.CLIENT_ID,
      serverConfig.CLIENT_SECRET,
      serverConfig.REDIRECT_URI
    );
    oAuth2Client.setCredentials({
      refresh_token: serverConfig.REFRESH_TOKEN,
    });

    const accessToken = await oAuth2Client.getAccessToken();
    
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: serverConfig.USER,
        // pass: serverConfig.PASS,
        clientId: serverConfig.CLIENT_ID,
        clientSecret: serverConfig.CLIENT_SECRET,
        refreshToken: serverConfig.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    await transporter.sendMail({
      from: serverConfig.USER,
      to: email,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.log("Something Went Wrong: Nodemailer Config: Send Email", error);
    throw { error };
  }
};

module.exports = { sendEmail };
