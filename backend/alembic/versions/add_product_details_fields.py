"""add product details fields

Revision ID: add_product_details
Revises: add_variant_id_media
Create Date: 2026-01-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_product_details'
down_revision = 'add_variant_id_media'
branch_labels = None
depends_on = None


def upgrade():
    # Add ingredients and how_to_use columns to products table
    op.add_column('products', 
        sa.Column('ingredients', sa.Text(), nullable=True)
    )
    op.add_column('products', 
        sa.Column('how_to_use', sa.Text(), nullable=True)
    )


def downgrade():
    # Remove the columns
    op.drop_column('products', 'how_to_use')
    op.drop_column('products', 'ingredients')
