"""
Script to populate the database with sample products (attars and perfumes)
Run this after migrations: python populate_products.py
"""

import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from apps.products.models import Product, ProductVariant, ProductMedia
from config.database import SessionLocal


def populate_products():
    db: Session = SessionLocal()
    
    try:
        products_data = [
            # Our Best Sellers - Attars
            {
                "product_name": "Royal Oud Attar",
                "description": "A luxurious blend of pure oud with subtle floral notes. This premium attar captures the essence of traditional Arabian perfumery.",
                "ingredients": "Pure Oud Oil, Rose Extract, Sandalwood, Natural Musk",
                "how_to_use": "Apply a small amount to pulse points such as wrists, behind ears, and neck. Attar is highly concentrated, so a little goes a long way.",
                "category": "Our Best Sellers",
                "product_type": "attar",
                "status": "active",
                "price": 899.00,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80"
            },
            {
                "product_name": "Mystic Rose Attar",
                "description": "Pure rose attar extracted from thousands of rose petals. A timeless fragrance loved for centuries.",
                "ingredients": "Rosa Damascena Extract, Natural Rose Oil, Carrier Oil",
                "how_to_use": "Dab gently on pulse points. Can also be added to unscented lotions or bath water.",
                "category": "Our Best Sellers",
                "product_type": "attar",
                "status": "active",
                "price": 749.00,
                "stock": 75,
                "image_url": "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80"
            },
            {
                "product_name": "Sandalwood Dreams Attar",
                "description": "Rich, creamy sandalwood attar with warm, woody notes. Perfect for meditation and daily wear.",
                "ingredients": "Pure Sandalwood Oil, Vetiver, Cedarwood",
                "how_to_use": "Apply to pulse points or add to your favorite carrier oil for a custom blend.",
                "category": "Our Best Sellers",
                "product_type": "attar",
                "status": "active",
                "price": 599.00,
                "stock": 100,
                "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
            },
            
            # Our Best Sellers - Perfumes
            {
                "product_name": "Velvet Noir Eau de Parfum",
                "description": "A sophisticated evening fragrance with notes of bergamot, jasmine, and vanilla. Long-lasting and elegant.",
                "ingredients": "Alcohol Denat, Fragrance, Water, Bergamot Oil, Jasmine Absolute, Vanilla Extract",
                "how_to_use": "Spray on pulse points from 6 inches away. Apply to wrists, neck, and behind ears for best results.",
                "category": "Our Best Sellers",
                "product_type": "perfume",
                "status": "active",
                "price": 1299.00,
                "stock": 60,
                "image_url": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"
            },
            {
                "product_name": "Citrus Burst Eau de Toilette",
                "description": "Fresh and vibrant citrus fragrance perfect for daily wear. Energizing blend of lemon, orange, and grapefruit.",
                "ingredients": "Alcohol, Fragrance, Lemon Oil, Orange Oil, Grapefruit Extract, Mint",
                "how_to_use": "Spray liberally for a refreshing burst. Reapply throughout the day as needed.",
                "category": "Our Best Sellers",
                "product_type": "perfume",
                "status": "active",
                "price": 899.00,
                "stock": 80,
                "image_url": "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=800&q=80"
            },
            
            # Famous Fragrances - Attars
            {
                "product_name": "Amber Noir Attar",
                "description": "Deep, rich amber attar with hints of spice and wood. A signature scent of royalty.",
                "ingredients": "Amber Resin, Patchouli, Cinnamon, Clove",
                "how_to_use": "Apply sparingly to pulse points. The warmth of your skin will enhance the fragrance.",
                "category": "Famous Fragrances",
                "product_type": "attar",
                "status": "active",
                "price": 999.00,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1587556930579-682591cb9bb2?w=800&q=80"
            },
            {
                "product_name": "Jasmine Night Attar",
                "description": "Intoxicating jasmine attar harvested at night when flowers are most fragrant. Pure and potent.",
                "ingredients": "Jasmine Sambac Oil, Jasmine Grandiflorum, Carrier Oil",
                "how_to_use": "Use a drop or two on pulse points. Perfect for evening occasions.",
                "category": "Famous Fragrances",
                "product_type": "attar",
                "status": "active",
                "price": 849.00,
                "stock": 55,
                "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80"
            },
            
            # Famous Fragrances - Perfumes
            {
                "product_name": "Ocean Breeze Eau de Parfum",
                "description": "Fresh aquatic fragrance inspired by the sea. Notes of sea salt, driftwood, and citrus.",
                "ingredients": "Alcohol, Fragrance, Sea Salt Extract, Bergamot, Cedarwood, Ambergris",
                "how_to_use": "Spray on clothes and skin for a refreshing, long-lasting scent.",
                "category": "Famous Fragrances",
                "product_type": "perfume",
                "status": "active",
                "price": 1499.00,
                "stock": 45,
                "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
            },
            {
                "product_name": "Midnight Rose Perfume",
                "description": "Romantic floral perfume with deep rose and patchouli. Perfect for special evenings.",
                "ingredients": "Alcohol, Fragrance, Rose Absolute, Patchouli, Vanilla, Musk",
                "how_to_use": "Spray on pulse points and in the air, then walk through the mist.",
                "category": "Famous Fragrances",
                "product_type": "perfume",
                "status": "active",
                "price": 1399.00,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=80"
            },
            
            # Cherished by You - Attars
            {
                "product_name": "Lavender Peace Attar",
                "description": "Calming lavender attar perfect for relaxation and sleep. Pure and therapeutic grade.",
                "ingredients": "Lavender Essential Oil, Chamomile, Bergamot",
                "how_to_use": "Apply before bedtime to pulse points or add to pillow for better sleep.",
                "category": "Cherished by You",
                "product_type": "attar",
                "status": "active",
                "price": 649.00,
                "stock": 90,
                "image_url": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
            },
            {
                "product_name": "Musk Harmony Attar",
                "description": "Soft, clean musk attar that's universally loved. Subtle yet long-lasting.",
                "ingredients": "White Musk, Amber, Vanilla",
                "how_to_use": "Perfect for layering with other fragrances or wearing alone.",
                "category": "Cherished by You",
                "product_type": "attar",
                "status": "active",
                "price": 799.00,
                "stock": 70,
                "image_url": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80"
            },
            
            # Cherished by You - Perfumes
            {
                "product_name": "Vanilla Dreams Perfume",
                "description": "Sweet, warm vanilla perfume with hints of caramel and tonka bean. Comforting and delicious.",
                "ingredients": "Alcohol, Fragrance, Vanilla Extract, Tonka Bean, Caramel, Brown Sugar",
                "how_to_use": "Spray generously for a sweet, enveloping fragrance cloud.",
                "category": "Cherished by You",
                "product_type": "perfume",
                "status": "active",
                "price": 999.00,
                "stock": 65,
                "image_url": "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80"
            },
            {
                "product_name": "Garden Bloom Eau de Toilette",
                "description": "Fresh floral bouquet with peony, lily, and green notes. Light and feminine.",
                "ingredients": "Alcohol, Fragrance, Peony Extract, Lily, Green Tea, Freesia",
                "how_to_use": "Perfect for daytime wear. Spray on clothes for lasting freshness.",
                "category": "Cherished by You",
                "product_type": "perfume",
                "status": "active",
                "price": 1099.00,
                "stock": 55,
                "image_url": "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80"
            },
        ]
        
        print("Starting to populate products...")
        
        for data in products_data:
            # Check if product already exists
            existing = db.query(Product).filter(Product.product_name == data["product_name"]).first()
            if existing:
                print(f"Product '{data['product_name']}' already exists. Skipping...")
                continue
            
            # Create product
            product = Product(
                product_name=data["product_name"],
                description=data["description"],
                ingredients=data["ingredients"],
                how_to_use=data["how_to_use"],
                category=data["category"],
                product_type=data["product_type"],
                status=data["status"]
            )
            db.add(product)
            db.flush()  # Get the product ID
            
            # Create variant
            variant = ProductVariant(
                product_id=product.id,
                price=data["price"],
                stock=data["stock"]
            )
            db.add(variant)
            db.flush()
            
            # Create media
            media = ProductMedia(
                product_id=product.id,
                variant_id=None,
                src=data["image_url"],
                cloudinary_id=f"sample_{product.id}",
                alt=data["product_name"],
                type="image"
            )
            db.add(media)
            
            print(f"✓ Created: {data['product_name']} ({data['product_type']}) - {data['category']}")
        
        db.commit()
        print("\n✓ All products populated successfully!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    populate_products()
