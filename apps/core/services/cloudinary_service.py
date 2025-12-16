import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from config.settings import (
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
)

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)

class CloudinaryService:

    @staticmethod
    async def upload_image(
        file: UploadFile,
        folder: str,
        public_id: str | None = None,
    ):
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            public_id=public_id,
            resource_type="image",
        )

        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "format": result["format"],
        }

    @staticmethod
    def delete_image(public_id: str):
        cloudinary.uploader.destroy(public_id)
