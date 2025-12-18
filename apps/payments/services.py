from apps.payments.razorpay_client import client
from apps.payments.models import Payment
from apps.orders.models import Order

class PaymentService:

    @staticmethod
    def create_payment(order: Order):
        rzp_order = client.order.create({
            "amount": int(order.total_amount * 100),  # INR → paise
            "currency": "INR",
            "receipt": f"order_{order.id}"
        })

        Payment.create(
            order_id=order.id,
            razorpay_order_id=rzp_order["id"],
            amount=order.total_amount,
            status="created"
        )

        return rzp_order
