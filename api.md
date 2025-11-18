# API Reference (brief)

This document lists the project's HTTP APIs with their request parameters and response formats. Use this to design the frontend for the perfume e-commerce store.

---

## Authentication & Users (/accounts)

- POST /accounts/register
  - Description: Register a new user and send an OTP to email.
  - Body (JSON): { email: string, password: string, password_confirm: string }
  - Response (201): { email: string, message: string }
  - Notes: After registering, call `/accounts/register/verify` to confirm OTP.

- PATCH /accounts/register/verify
  - Description: Verify registration by OTP.
  - Body (JSON): { email: string, otp: string }
  - Response (200): { access_token: string, message: string }

- POST /accounts/login
  - Description: Login with credentials (OAuth2 password form).
  - Form fields: `username` (email), `password`
  - Response (200): { access_token: string, token_type: string }

- POST /accounts/logout
  - Description: Logout current authenticated user.
  - Auth: required
  - Response (204): no content

- POST /accounts/reset-password
  - Description: Initiate password reset (sends OTP to email).
  - Body: { email: string }
  - Response (200): { message: string }

- PATCH /accounts/reset-password/verify
  - Description: Verify OTP and set new password.
  - Body: { email: string, otp: string, password: string, password_confirm: string }
  - Response (200): { message: string }

- POST /accounts/otp
  - Description: Resend OTP for register, reset-password, or change-email.
  - Body: { request_type: string, email: string }
    - `request_type` allowed values: `register`, `reset-password`, `change-email`
  - Response (204): no content

- GET /accounts/me
  - Description: Get current authenticated user.
  - Auth: required
  - Response (200): { user: { user_id:int, email:string, first_name:string|null, last_name:string|null, is_verified_email:bool, date_joined:str, updated_at:str, last_login:str } }

- PUT /accounts/me
  - Description: Update current user.
  - Body: { first_name?: string, last_name?: string }
  - Auth: required
  - Response (200): { user: <same shape as GET /accounts/me> }

- PATCH /accounts/me/password
  - Description: Change current user's password.
  - Body: { current_password: string, password: string, password_confirm: string }
  - Auth: required
  - Response (200): { message: string }

- POST /accounts/me/email
  - Description: Request to change the user's email (sends OTP to the new email).
  - Body: { new_email: string }
  - Auth: required
  - Response (200): { message: string }

- PATCH /accounts/me/email/verify
  - Description: Verify email change with OTP.
  - Body: { otp: string }
  - Auth: required
  - Response (200): { message: string }

- GET /accounts/{user_id}
  - Description: Retrieve a single user by id (admin only).
  - Auth: admin required
  - Response (200): { user: <same user shape as GET /accounts/me> }

---

## Products (/products)

All product responses are wrapped in an object with keys such as `product`, `products`, `variant`, `variants`, or `media`.

- POST /products/
  - Description: Create a new product (admin only).
  - Body (JSON): {
      product_name: string,
      description?: string,
      status?: string,
      price?: number,    // default 0
      stock?: number,    // default 0
      options?: [ { option_name: string, items: [string] } ]
    }
  - Response (201): { product: Product }

  - Product fields (Product):
    - product_id: int
    - product_name: string
    - description: string | null
    - status: string | null
    - created_at: str
    - updated_at: str | null
    - published_at: str | null
    - options: [ { options_id:int, option_name:string, items:[ { item_id:int, item_name:string } ] } ] | null
    - variants: [ { variant_id:int, product_id:int, price:float, stock:int, option1:int|null, option2:int|null, option3:int|null, created_at:str, updated_at:str|null } ] | null
    - media: [ { media_id:int, product_id:int, alt:string, src:string, type:string, created_at:str, updated_at:str|null } ] | null

- GET /products/{product_id}
  - Description: Retrieve single product.
  - Response (200): { product: Product }

- GET /products/
  - Description: Retrieve list of products.
  - Response (200): { products: [ Product, ... ] } or 204 if none

- PUT /products/{product_id}
  - Description: Update product (admin only).
  - Body: { product_name?: string, description?: string, status?: string }
  - Response (200): { product: Product }

- DELETE /products/{product_id}
  - Description: Delete a product (admin only).
  - Response (204): no content

### Product Variants

- PUT /products/variants/{variant_id}
  - Description: Update an existing variant (admin only).
  - Body: { price?: float, stock?: int }
  - Response (200): { variant: Variant }

- GET /products/variants/{variant_id}
  - Description: Retrieve a single variant.
  - Response (200): { variant: Variant }

- GET /products/{product_id}/variants
  - Description: Get all variants for a product.
  - Response (200): { variants: [ Variant, ... ] }

### Product Media / Images

- POST /products/{product_id}/media
  - Description: Upload one or more images for a product (admin only).
  - Request: multipart/form-data with files (UploadFile list) and optional `alt` form field.
  - Response (201): { media: [ ProductMedia, ... ] }

- GET /products/media/{media_id}
  - Description: Retrieve a single media entry.
  - Response (200): { media: ProductMedia }

- GET /products/{product_id}/media
  - Description: List media for a product.
  - Response (200): { media: [ ProductMedia, ... ] } or 204 if none

- PUT /products/media/{media_id}
  - Description: Update media file or alt text (admin only).
  - Request: multipart/form-data with `file` UploadFile and optional `alt` field.
  - Response (200): { media: ProductMedia }

- DELETE /products/{product_id}/media?media_ids=1,2,3
  - Description: Unattach/delete multiple media from a product (admin only).
  - Query: `media_ids` comma separated
  - Response (204): no content

- DELETE /products/media/{media_id}
  - Description: Delete a media file (admin only).
  - Response (204): no content

---

## Authentication & Authorization Notes

- Many admin operations are protected with `Permission.is_admin` dependency. Gate creations, updates and deletions for products/variants/media to admin users.
- Endpoints that require the current authenticated user use `AccountService.current_user` dependency.

## Response Envelope & Status Codes

- Most successful GET/PUT/POSTs return an object keyed by the resource name (e.g., `{ "product": ... }`, `{ "media": ... }`).
- Deletions and some actions return `204 No Content`.

---

If you want, I can:
- add example request/response JSON for each endpoint,
- generate OpenAPI-compatible markdown or Postman collection,
- or produce a minimal frontend API client (JS) to consume these endpoints.
