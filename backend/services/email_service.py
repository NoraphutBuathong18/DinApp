import resend
from config import RESEND_API_KEY

resend.api_key = RESEND_API_KEY

async def send_otp_email(email_to: str, otp: str):
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4CAF50; margin: 0;">DinApp Authentication</h1>
        </div>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">You have requested to securely log in to DinApp. Please use the verification code below to complete your login.</p>
        <div style="background-color: #f1f8f1; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">{otp}</span>
        </div>
        <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 DinApp. All rights reserved.</p>
    </div>
    """

    # For free Resend accounts without a verified domain, you MUST use onboarding@resend.dev as the sender.
    params = {
        "from": "onboarding@resend.dev",
        "to": [email_to],
        "subject": "Your DinApp Login Code",
        "html": html_content,
    }

    email = resend.Emails.send(params)
    return email
