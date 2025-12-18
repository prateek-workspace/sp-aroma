from decimal import Decimal

from apps.orders.models import Order, OrderItem
from apps.products.models import ProductVariant
from config.database import SessionLocal


class OrderService:

    @staticmethod
    def create_order(user_id: int, data: dict):
        items = data["items"]
        address_id = data["address_id"]

        total_amount = Decimal("0.00")
        order_items = []

        with SessionLocal() as session:

            for item in items:
                variant = session.get(ProductVariant, item["variant_id"])

                if not variant:
                    raise ValueError("Invalid product variant")

                item_total = variant.price * item["quantity"]
                total_amount += item_total

                order_items.append(
                    OrderItem(
                        product_id=variant.product_id,
                        variant_id=variant.id,
                        quantity=item["quantity"],
                        price=variant.price
                    )
                )

            order = Order.create(
                user_id=user_id,
                address_id=address_id,
                total_amount=total_amount,
                status="created"
            )

            for oi in order_items:
                oi.order_id = order.id
                session.add(oi)

            session.commit()
            session.refresh(order)

        return OrderService.retrieve_order(order.id)

    @staticmethod
    def retrieve_order(order_id: int):
        order = Order.get_or_404(order_id)

        return {
            "id": order.id,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": [
                {
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "quantity": item.quantity,
                    "price": item.price
                }
                for item in order.items
            ]
        }

    @staticmethod
    def list_user_orders(user_id: int):
        orders = Order.filter(Order.user_id == user_id).all()

        return [
            OrderService.retrieve_order(order.id)
            for order in orders
        ]
