from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from apps.orders.schemas import CreateOrderIn
from apps.orders.services import OrderService
from apps.accounts.dependencies import get_current_user

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_order(
    payload: CreateOrderIn,
    user=Depends(get_current_user)
):
    order = OrderService.create_order(
        user_id=user.id,
        data=payload.model_dump()
    )
    return {"order": order}


@router.get(
    "/{order_id}",
    status_code=status.HTTP_200_OK
)
def retrieve_order(
    order_id: int,
    user=Depends(get_current_user)
):
    order = OrderService.retrieve_order(order_id)
    return {"order": order}


@router.get(
    "/",
    status_code=status.HTTP_200_OK
)
def list_my_orders(
    user=Depends(get_current_user)
):
    orders = OrderService.list_user_orders(user.id)

    if not orders:
        return JSONResponse(status_code=204, content=None)

    return {"orders": orders}
