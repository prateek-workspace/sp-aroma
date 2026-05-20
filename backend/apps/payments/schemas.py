from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class PaymentCreateOut(BaseModel):
    razorpay_order_id: str
    amount: int
    currency: str
    key_id: str
    order_id: int
    payment_mode: str = "razorpay"


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerifyOut(BaseModel):
    status: str
    order_id: int
    verified: bool


class PaymentConfigOut(BaseModel):
    payment_mode: str
    razorpay_key_id: Optional[str] = None