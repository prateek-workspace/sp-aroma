"""add razorpay_signature and currency to payments

Revision ID: f1a2b3c4d5e7
Revises: d048331a6f6f
Create Date: 2026-03-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e7'
down_revision: Union[str, None] = 'add_product_category'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('payments', sa.Column('razorpay_signature', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('currency', sa.String(), server_default='INR', nullable=True))


def downgrade() -> None:
    op.drop_column('payments', 'currency')
    op.drop_column('payments', 'razorpay_signature')
