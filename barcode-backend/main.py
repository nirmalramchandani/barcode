from fastapi import FastAPI
import requests
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your React frontend (running on Vite default: http://localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,         # frontend URLs allowed
    allow_credentials=True,
    allow_methods=["*"],           # GET, POST, PUT, DELETE etc.
    allow_headers=["*"],           # All headers allowed
)

@app.get("/scan/{barcode}")
def scan_barcode(barcode: str):
    """
    Scans a barcode and retrieves product information from the Open Food Facts API.
    """
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    r = requests.get(url)
    data = r.json()

    if "product" not in data:
        return {"status": "error", "message": "Product not found"}

    product = data["product"]

    # Clean response and return relevant product details
    return {
        "status": "success",
        "barcode": barcode,
        "name": product.get("product_name"),
        "brand": product.get("brands"),
        "ingredients": product.get("ingredients_text"),
        "nutrients": product.get("nutriments"),
        "allergens": product.get("allergens_tags"),
        "nutriscore": product.get("nutriscore_grade"),
        "nova_group": product.get("nova_group"),
        "image": product.get("image_front_url"),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)