# fbase.py
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("Gwallet/firebase_key/gwallet-180a9-firebase-adminsdk-fbsvc-c1fbf88538.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def insert_data(receipt_data):
    """
    Save receipt data to Firestore
    receipt_data is a dict with keys: type_of_purchase, establishment_name, date, total, items
    """
    try:
        # Save main receipt document
        doc_ref = db.collection("receipts").add({
            "type_of_purchase": receipt_data.get("type_of_purchase"),
            "establishment_name": receipt_data.get("establishment_name"),
            "date": receipt_data.get("date"),
            "total": receipt_data.get("total"),
            "created_at": firestore.SERVER_TIMESTAMP
        })
        receipt_id = doc_ref[1].id

        # Save items as subcollection
        for item in receipt_data.get("items", []):
            db.collection("receipts").document(receipt_id).collection("items").add({
                "item_name": item.get("name"),
                "price": item.get("price"),
                "quantity": item.get("quantity")
            })

        print(f"Receipt saved to Firestore. ID: {receipt_id}")
        return receipt_id

    except Exception as e:
        print("Error saving to Firebase:", e)
        return None
