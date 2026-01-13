import resend
import base64
from typing import List, Optional
from apps.accounts.services.token import TokenService
from config.settings import AppConfig

class EmailService:
    """
    Handles all OTP and transactional emails using Resend API.
    """

    app = AppConfig.get_config()

    resend.api_key = app.resend_api_key

    @classmethod
    def send(cls, subject: str, html: str, to: str, attachments: Optional[List[dict]] = None):
        """
        Generic email sender via Resend.
        attachments: List of dicts with 'filename' and 'content' (base64 encoded)
        """
        try:
            email_data = {
                "from": f"{cls.app.project_name} <{cls.app.resend_from_email}>",
                "to": [to],
                "subject": subject,
                "html": html
            }
            
            if attachments:
                email_data["attachments"] = attachments
            
            resend.Emails.send(email_data)
        except Exception as e:
            print("❌ Error sending email:", e)
            raise

    @classmethod
    def register_send_verification_email(cls, to_address: str):
        otp = TokenService.create_otp_token()
        subject = "Email Verification"
        html = f"""
        <p>Thank you for registering!</p>
        <p>Your OTP: <strong>{otp}</strong></p>
        <p>This code expires in 5 minutes.</p>
        """
        cls.send(subject, html, to_address)

    @classmethod
    def reset_password_send_verification_email(cls, to_address: str):
        otp = TokenService.create_otp_token()
        subject = "Password Reset Verification"
        html = f"""
        <p>Use the OTP below to reset your password:</p>
        <p><strong>{otp}</strong></p>
        """
        cls.send(subject, html, to_address)

    @classmethod
    def change_email_send_verification_email(cls, new_email: str):
        otp = TokenService.create_otp_token()
        subject = "Email Change Verification"
        html = f"""
        <p>Use the OTP below to verify your new email address:</p>
        <p><strong>{otp}</strong></p>
        """
        cls.send(subject, html, new_email)

    @classmethod
    def send_welcome_email(cls, to_address: str, user_name: str = None):
        """
        Send welcome email after successful account creation
        """
        subject = "Welcome to SP Aroma!"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8D7B7C;">Welcome to SP Aroma{f', {user_name}' if user_name else ''}!</h2>
            <p>Thank you for creating an account with us.</p>
            <p>We're thrilled to have you as part of our fragrance family. Explore our exquisite collection of handcrafted perfumes and pure attars from Kannauj.</p>
            <p style="margin-top: 20px;">
                <strong>What's Next?</strong><br>
                • Browse our Best Sellers<br>
                • Discover Famous Fragrances<br>
                • Find your signature scent
            </p>
            <p style="margin-top: 20px;">Happy Shopping!</p>
            <p style="color: #626363;">The SP Aroma Team</p>
        </div>
        """
        cls.send(subject, html, to_address)

    @classmethod
    def send_order_confirmation_email(cls, to_address: str, order_details: dict):
        """
        Send order confirmation email with order details
        """
        order_id = order_details.get('order_id', 'N/A')
        order_date = order_details.get('created_at', 'N/A')
        total_amount = order_details.get('total_amount', 0)
        items = order_details.get('items', [])
        
        # Build items HTML
        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('product_name', 'N/A')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item.get('price', 0)}</td>
            </tr>
            """
        
        subject = f"Order Confirmation #{order_id}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8D7B7C;">Thank You for Your Order!</h2>
            <p>Your order has been successfully placed and is being processed.</p>
            
            <div style="background-color: #F5EFEF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #8D7B7C;">Order Details</h3>
                <p><strong>Order ID:</strong> #{order_id}</p>
                <p><strong>Order Date:</strong> {order_date}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #F5EFEF;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Quantity</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #8D7B7C; font-size: 18px;">₹{total_amount}</td>
                    </tr>
                </tfoot>
            </table>
            
            <p style="margin-top: 20px;">We'll send you another email once your order has been shipped.</p>
            <p style="color: #626363;">Thank you for shopping with SP Aroma!</p>
        </div>
        """
        cls.send(subject, html, to_address)

    @classmethod
    def send_bulk_custom_email(cls, subject: str, html: str, recipients: List[str], attachments: Optional[List[dict]] = None):
        """
        Send custom email to multiple recipients
        """
        failed_emails = []
        success_count = 0
        
        for email in recipients:
            try:
                cls.send(subject, html, email, attachments)
                success_count += 1
            except Exception as e:
                print(f"Failed to send to {email}: {e}")
                failed_emails.append(email)
        
        return {
            "success_count": success_count,
            "failed_count": len(failed_emails),
            "failed_emails": failed_emails
        }
