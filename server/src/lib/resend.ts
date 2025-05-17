import { Resend } from "resend";
import { IS_CLOUD } from "./const.js";

let resend: Resend | undefined;

if (IS_CLOUD) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export const sendEmail = async (
  email: string,
  subject: string,
  html: string
) => {
  if (!resend) {
    throw new Error("Resend is not initialized");
  }
  try {
    const response = await resend.emails.send({
      from: "Rybbit <onboarding@app.rybbit.io>",
      to: email,
      subject,
      html,
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const sendInvitationEmail = async (
  email: string,
  invitedBy: string,
  organizationName: string,
  inviteLink: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join Rybbit</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #ecfdf5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #d1fae5;
          }
          .logo {
            margin: 0 auto;
            width: 80px;
            height: auto;
            margin-bottom: 10px;
          }
          .content {
            padding: 30px 20px;
          }
          .invite-text {
            font-size: 16px;
            margin-bottom: 25px;
          }
          .highlight {
            font-weight: bold;
            color: #059669;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            font-weight: bold;
            border-radius: 6px;
            font-size: 16px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #059669;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #d1fae5;
            font-size: 12px;
            color: #999;
          }
          h2 {
            color: #065f46;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://raw.githubusercontent.com/rybbit-io/rybbit/refs/heads/master/client/public/rybbit.png" alt="Rybbit" class="logo" width="200">
          </div>
          <div class="content">
            <h2>You've Been Invited!</h2>
            <div class="invite-text">
              <p><span class="highlight">${invitedBy}</span> has invited you to join <span class="highlight">${organizationName}</span> on Rybbit Analytics.</p>
              <p>Rybbit is an open-source analytics platform that helps you understand your website traffic while respecting user privacy.</p>
            </div>
            <div class="button-container">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            <p>If you have any questions, please contact the person who invited you.</p>
          </div>
          <div class="footer">
            <p>This invitation was sent to ${email}.</p>
            <p>&copy; ${new Date().getFullYear()} Rybbit Analytics</p>
          </div>
        </div>
      </body>
    </html>
  `;
  await sendEmail(
    email,
    "You're Invited to Join an Organization on Rybbit",
    html
  );
};
