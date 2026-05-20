# apps/cart/services.py

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload, subqueryload

from config.database import SessionLocal
from config.settings import AppConfig
from apps.cart.models import Cart, CartItem
from apps.products.models import Product, ProductVariant
from apps.orders.services import OrderService


class CartService:
    """
    Cart persistence + checkout
    """

    @staticmethod
    def _get_or_create_cart(session: Session, user_id: int) -> Cart:
        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            session.add(cart)
            session.flush()
        return cart

    @staticmethod
    def _serialize_cart(cart: Cart):
        items = []
        total = 0

        for item in cart.items:
            if item.variant_id:
                price = float(item.variant.price)
            else:
                price = float(item.product.price)

            subtotal = price * item.quantity
            total += subtotal

            # Get product name
            product_name = item.product.product_name if item.product else "Unknown Product"

            # Get image URL from product media (Cloudinary URL)
            image_url = ""
            if item.product and item.product.media:
                # Prefer variant-specific image, fallback to first product image
                if item.variant_id:
                    variant_media = [m for m in item.product.media if m.variant_id == item.variant_id]
                    if variant_media:
                        image_url = variant_media[0].src
                if not image_url:
                    image_url = item.product.media[0].src

            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "variant_id": item.variant_id,
                "product_name": product_name,
                "image_url": image_url,
                "quantity": item.quantity,
                "price": price,
                "subtotal": subtotal,
            })

        return {
            "items": items,
            "total_amount": total,
            "currency": "INR",
        }

    @staticmethod
    def _load_cart_with_relations(session: Session, cart_id: int):
        """Re-load cart with all relationships eagerly loaded for serialization."""
        return session.query(Cart).options(
            joinedload(Cart.items)
                .joinedload(CartItem.product)
                .joinedload(Product.media),
            joinedload(Cart.items).joinedload(CartItem.variant)
        ).filter(Cart.id == cart_id).first()

    # ------------------------
    # APIs
    # ------------------------

    @classmethod
    def add_item(cls, user_id: int, payload: dict):
        session = SessionLocal()
        try:
            product_id = payload["product_id"]
            variant_id = payload.get("variant_id")
            quantity = payload.get("quantity", 1)

            if quantity <= 0:
                raise HTTPException(400, "Quantity must be >= 1")

            product = session.get(Product, product_id)
            if not product:
                raise HTTPException(404, "Product not found")

            if variant_id:
                variant = session.get(ProductVariant, variant_id)
                if not variant:
                    raise HTTPException(400, "Invalid variant_id")

            cart = cls._get_or_create_cart(session, user_id)

            item = session.query(CartItem).filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variant_id=variant_id
            ).first()

            if item:
                item.quantity += quantity
            else:
                session.add(CartItem(
                    cart_id=cart.id,
                    product_id=product_id,
                    variant_id=variant_id,
                    quantity=quantity
                ))

            session.commit()

            # Re-load cart with eager loading for product media
            cart = cls._load_cart_with_relations(session, cart.id)
            return cls._serialize_cart(cart)
        finally:
            session.close()

    @classmethod
    def get_cart(cls, user_id: int):
        session = SessionLocal()
        try:
            # Eager load cart items with product and variant in single query
            cart = session.query(Cart).options(
                joinedload(Cart.items)
                    .joinedload(CartItem.product)
                    .joinedload(Product.media),
                joinedload(Cart.items).joinedload(CartItem.variant)
            ).filter_by(user_id=user_id).first()

            if not cart:
                return {"items": [], "total_amount": 0, "currency": "INR"}
            return cls._serialize_cart(cart)
        finally:
            session.close()

    @classmethod
    def update_item(cls, user_id: int, item_id: int, quantity: int):
        if quantity <= 0:
            raise HTTPException(400, "Quantity must be >= 1")

        session = SessionLocal()
        try:
            item = session.get(CartItem, item_id)
            if not item or item.cart.user_id != user_id:
                raise HTTPException(404, "Item not found")

            item.quantity = quantity
            cart_id = item.cart.id
            session.commit()

            # Re-load cart with eager loading for product media
            cart = cls._load_cart_with_relations(session, cart_id)
            return cls._serialize_cart(cart)
        finally:
            session.close()

    @classmethod
    def delete_item(cls, user_id: int, item_id: int):
        session = SessionLocal()
        try:
            item = session.get(CartItem, item_id)
            if not item or item.cart.user_id != user_id:
                raise HTTPException(404, "Item not found")

            cart_id = item.cart.id
            session.delete(item)
            session.commit()

            # Re-load cart with eager loading for product media
            cart = cls._load_cart_with_relations(session, cart_id)
            return cls._serialize_cart(cart)
        finally:
            session.close()

    @classmethod
    def checkout(cls, user_id: int, address_id: int):
        """
        Creates the order and:
        - If PAYMENT_MODE=razorpay → order created with PENDING status, frontend opens Razorpay
        - If PAYMENT_MODE=mock → completes order immediately with mock payment
        """
        session: Session = SessionLocal()
        try:
            cart = session.query(Cart).options(
                joinedload(Cart.items).joinedload(CartItem.variant),
                joinedload(Cart.items).joinedload(CartItem.product),
            ).filter_by(user_id=user_id).first()

            if not cart or not cart.items:
                raise HTTPException(status_code=400, detail="Cart is empty")

            config = AppConfig.get_config()
            is_razorpay = config.PAYMENT_MODE == "razorpay"

            order = OrderService.create_from_cart(
                session=session,
                user_id=user_id,
                address_id=address_id,
                cart=cart,
                mock_payment=not is_razorpay,
            )

            # Clear cart
            session.query(CartItem).filter_by(cart_id=cart.id).delete()
            session.commit()

            if is_razorpay:
                return {
                    "order_id": order.id,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "payment_mode": "razorpay",
                }
            else:
                return {
                    "order_id": order.id,
                    "status": order.status,
                    "payment": "mock_success",
                    "payment_mode": "mock",
                }

        except Exception:
            session.rollback()
            raise
        finally:
            session.close()