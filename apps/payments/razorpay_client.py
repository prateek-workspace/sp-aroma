import razorpay
from config.settings import AppConfig

client = razorpay.Client(
    auth=(AppConfig.RAZORPAY_KEY_ID, AppConfig.RAZORPAY_KEY_SECRET)
)
