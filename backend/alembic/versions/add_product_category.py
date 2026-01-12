"""add product category and type

Revision ID: add_product_category
Revises: add_product_details
Create Date: 2026-01-13 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_product_category'
down_revision = 'add_product_details'
branch_labels = None
depends_on = None


def upgrade():
    # Add category and product_type columns to products table
    op.add_column('products', 
        sa.Column('category', sa.String(255), nullable=True)
    )
    op.add_column('products', 
        sa.Column('product_type', sa.String(50), nullable=True, server_default='perfume')
    )


def downgrade():
    # Remove the columns
    op.drop_column('products', 'product_type')
    op.drop_column('products', 'category')
