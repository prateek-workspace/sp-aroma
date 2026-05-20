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

    # ------------------------------------------------------------------
    # Branded HTML helpers — colors must match the admin "Send Email" tab
    # (BulkEmailSender.tsx): #8D7B7C heading, #F5EFEF surface, #626363 text.
    # ------------------------------------------------------------------
    BRAND_HEADING = "#8D7B7C"
    BRAND_SURFACE = "#F5EFEF"
    BRAND_TEXT = "#626363"

    ORDER_STATUS_COPY = {
        "PLACED":           ("Order Placed",        "We've received your order and it's being prepared for confirmation."),
        "CONFIRMED":        ("Order Confirmed",     "Your order has been confirmed. We're getting it ready for you."),
        "PROCESSING":       ("Order Being Processed", "Your order is now being processed at our facility."),
        "PACKING":          ("Order Being Packed",  "Our team is carefully packing your fragrances right now."),
        "PACKED":           ("Order Packed",        "Your order is packed and ready to leave our facility."),
        "SHIPPED":          ("Order Shipped",       "Great news! Your order has been shipped and is on its way."),
        "IN_TRANSIT":       ("Order In Transit",    "Your order is in transit. It will be with you very soon."),
        "OUT_FOR_DELIVERY": ("Out for Delivery",    "Your order is out for delivery and will arrive today."),
        "DELIVERED":        ("Order Delivered",     "Your order has been delivered. We hope you love your fragrances!"),
        "CANCELLED":        ("Order Cancelled",     "Your order has been cancelled. If this wasn't expected, please contact us."),
        "CANCEL_REQUESTED": ("Cancellation Requested", "We've received your cancellation request and our team will review it shortly."),
        "PAYMENT_FAILED":   ("Payment Failed",      "We couldn't process the payment for your order. Please try again."),
        "PENDING":          ("Order Pending",       "Your order is pending. We're waiting on a payment confirmation."),
    }

    @classmethod
    def _render_items_table(cls, items: list) -> str:
        rows = ""
        for item in items or []:
            name = item.get("product_name", "Item")
            qty = item.get("quantity", 1)
            line_total = item.get("price", item.get("subtotal", 0))
            rows += (
                f'<tr>'
                f'<td style="padding:10px;border-bottom:1px solid #eee;color:{cls.BRAND_TEXT};">{name}</td>'
                f'<td style="padding:10px;border-bottom:1px solid #eee;text-align:center;color:{cls.BRAND_TEXT};">{qty}</td>'
                f'<td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:{cls.BRAND_TEXT};">₹{line_total}</td>'
                f'</tr>'
            )
        if not rows:
            rows = (
                f'<tr><td colspan="3" style="padding:10px;text-align:center;color:{cls.BRAND_TEXT};">'
                f'No item details available.</td></tr>'
            )
        return (
            f'<table style="width:100%;border-collapse:collapse;margin:20px 0;">'
            f'<thead>'
            f'<tr style="background-color:{cls.BRAND_SURFACE};">'
            f'<th style="padding:10px;text-align:left;color:{cls.BRAND_HEADING};">Product</th>'
            f'<th style="padding:10px;text-align:center;color:{cls.BRAND_HEADING};">Quantity</th>'
            f'<th style="padding:10px;text-align:right;color:{cls.BRAND_HEADING};">Price</th>'
            f'</tr>'
            f'</thead>'
            f'<tbody>{rows}</tbody>'
            f'</table>'
        )

    @classmethod
    def send_order_status_update_email(cls, to_address: str, order_details: dict):
        """
        Branded transactional email sent whenever an admin (or the system)
        changes an order's status. `order_details` should include:
            order_id, status, created_at, total_amount, items[]
        """
        order_id = order_details.get("order_id", "N/A")
        order_date = order_details.get("created_at", "N/A")
        total_amount = order_details.get("total_amount", 0)
        items = order_details.get("items", [])
        status = (order_details.get("status") or "").upper()

        title, body_copy = cls.ORDER_STATUS_COPY.get(
            status,
            (f"Order {status.title()}", f"Your order status was updated to {status.replace('_', ' ').title()}.")
        )

        subject = f"{title} — Order #{order_id}"
        items_table = cls._render_items_table(items)

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: {cls.BRAND_TEXT};">
            <div style="background-color: {cls.BRAND_SURFACE}; padding: 24px; border-radius: 8px; text-align: center;">
                <h1 style="color: {cls.BRAND_HEADING}; margin: 0 0 8px; font-weight: 300; letter-spacing: 2px;">SP AROMA</h1>
                <h2 style="color: {cls.BRAND_HEADING}; margin: 0; font-weight: 400;">{title}</h2>
            </div>

            <p style="margin-top: 24px;">{body_copy}</p>

            <div style="background-color: {cls.BRAND_SURFACE}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: {cls.BRAND_HEADING};">Order Details</h3>
                <p style="margin: 4px 0;"><strong style="color: {cls.BRAND_HEADING};">Order ID:</strong> #{order_id}</p>
                <p style="margin: 4px 0;"><strong style="color: {cls.BRAND_HEADING};">Order Date:</strong> {order_date}</p>
                <p style="margin: 4px 0;"><strong style="color: {cls.BRAND_HEADING};">Current Status:</strong> {status.replace('_', ' ').title()}</p>
            </div>

            {items_table}

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                    <td style="padding:12px 10px;text-align:right;font-weight:bold;color:{cls.BRAND_HEADING};">Total Amount:</td>
                    <td style="padding:12px 10px;text-align:right;font-weight:bold;color:{cls.BRAND_HEADING};font-size:18px;width:120px;">₹{total_amount}</td>
                </tr>
            </table>

            <p style="margin-top: 24px;">If you have any questions about this update, just reply to this email and we'll help out.</p>
            <p style="color: {cls.BRAND_TEXT};">Thank you for shopping with SP Aroma.<br/><span style="color: {cls.BRAND_HEADING};">— The SP Aroma Team</span></p>
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
