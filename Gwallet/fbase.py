import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("Gwallet/firebase_key/gwallet-180a9-firebase-adminsdk-fbsvc-c1fbf88538.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def normalize_receipt(raw_data):
    """Standardize the structure of receipts."""
    receipt = {
        "type_of_purchase": raw_data.get("type_of_purchase", "Retail"),
        "establishment_name": raw_data.get("establishment_name", "Unknown Store"),
        "date": raw_data.get("date", ""),
        "total": raw_data.get("total", 0),
        "items": [],
    }

    for item in raw_data.get("items", []):
        receipt["items"].append({
            "name": item.get("name", "Unknown"),
            "price": item.get("price", 0),
            "quantity": item.get("quantity", 1),
        })
    return receipt


def insert_data(receipt_data):
    """Save a new receipt to Firestore."""
    try:
        receipt = normalize_receipt(receipt_data)
        doc_ref = db.collection("receipts").add({
            "type_of_purchase": receipt["type_of_purchase"],
            "establishment_name": receipt["establishment_name"],
            "date": receipt["date"],
            "total": receipt["total"],
            "created_at": firestore.SERVER_TIMESTAMP
        })[1]
        receipt_id = doc_ref.id

        for item in receipt["items"]:
            db.collection("receipts").document(receipt_id).collection("items").add(item)

        print(f"Receipt saved to Firestore: {receipt_id}")
        return receipt_id
    except Exception as e:
        print("Error saving to Firebase:", e)
        return None


def get_all_receipts():
    """Fetch all receipts + their items from Firestore."""
    receipts_ref = db.collection("receipts").order_by("created_at", direction=firestore.Query.DESCENDING)
    docs = receipts_ref.stream()
    receipts = []

    for doc in docs:
        data = doc.to_dict()
        items_ref = db.collection("receipts").document(doc.id).collection("items")
        items = [i.to_dict() for i in items_ref.stream()]
        data["items"] = items
        data["id"] = doc.id
        receipts.append(data)

    return receipts
