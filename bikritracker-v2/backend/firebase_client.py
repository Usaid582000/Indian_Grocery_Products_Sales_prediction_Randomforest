import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

_db = None

def get_db():
    global _db
    if _db is not None:
        return _db

    if not firebase_admin._apps:
        # Option 1: path to JSON file
        sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        # Option 2: raw JSON string (useful for cloud env vars)
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

        if sa_json:
            sa_dict = json.loads(sa_json)
            cred = credentials.Certificate(sa_dict)
        elif sa_path:
            cred = credentials.Certificate(sa_path)
        else:
            raise RuntimeError(
                "Set FIREBASE_SERVICE_ACCOUNT_PATH or "
                "FIREBASE_SERVICE_ACCOUNT_JSON in your .env"
            )

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def get_user_products(uid: str) -> list[dict]:
    """
    Fetch all products (with history arrays) for a given user.
    Returns a list of dicts ready for pandas.
    """
    db = get_db()
    products_ref = (
        db.collection("users")
          .document(uid)
          .collection("products")
    )
    docs = products_ref.stream()

    products = []
    for doc in docs:
        data = doc.to_dict()
        data["product_id"] = doc.id
        products.append(data)

    return products


def get_user_product(uid: str, product_id: str) -> dict | None:
    """Fetch a single product document."""
    db = get_db()
    ref = (
        db.collection("users")
          .document(uid)
          .collection("products")
          .document(product_id)
    )
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["product_id"] = doc.id
    return data