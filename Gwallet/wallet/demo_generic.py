import requests
from google.oauth2 import service_account
import google.auth.transport.requests
import json
import time
import jwt

# Load the structured receipt data
with open("receipts1.json", "r") as file:
    structured_response = json.load(file)

class CreateGeneric:
    def __init__(self):
        # Load service account
        self.SERVICE_ACCOUNT_FILE = "wallet-service-key.json"
        SCOPES = ["https://www.googleapis.com/auth/wallet_object.issuer"]

        self.credentials = service_account.Credentials.from_service_account_file(
            self.SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        request = google.auth.transport.requests.Request()
        self.credentials.refresh(request)

        # API endpoint
        self.BASE_URL = "https://walletobjects.googleapis.com/walletobjects/v1"
        self.ISSUER_ID = "3388000000023012969"

        # Create a class (template for passes)
        class_payload = {
            "id": f"{self.ISSUER_ID}.receiptClass123",
            "issuerName": "Project Raseed",
            "reviewStatus": "UNDER_REVIEW",
            "localizedTitle": {
                "defaultValue": {"language": "en-US", "value": "Receipt Summary"}
            },
            "localizedDescription": {
                "defaultValue": {"language": "en-US", "value": "Track your spending with Raseed"}
            },
        }

        response = requests.post(
            f"{self.BASE_URL}/genericClass",
            headers={
                "Authorization": f"Bearer {self.credentials.token}",
                "Content-Type": "application/json"
            },
            data=json.dumps(class_payload),
        )

        print(f"Class creation: {response.status_code}")
        if response.status_code not in [200, 409]:  # 409 means already exists
            print(response.text)

    def create_jwt_save_url(self, object_payload):
        """Create a signed JWT for the save to Google Wallet link"""
        with open(self.SERVICE_ACCOUNT_FILE, 'r') as f:
            service_account_info = json.load(f)
        
        # Create the JWT payload
        claims = {
            'iss': service_account_info['client_email'],
            'aud': 'google',
            'origins': [],
            'typ': 'savetowallet',
            'payload': {
                'genericObjects': [object_payload]
            }
        }
        
        # Sign the JWT
        token = jwt.encode(
            claims,
            service_account_info['private_key'],
            algorithm='RS256'
        )
        
        return f'https://pay.google.com/gp/v/save/{token}'

    def Generic_object(self, receipt_data):
        # Format items for display
        items_text = "\n".join([
            f"{item['name']}: {item['price']:.2f}₹ x {item['quantity']}"
            for item in receipt_data["items"]
        ])

        # Create unique object ID
        object_id = f"{self.ISSUER_ID}.receiptObject{int(time.time())}"

        # Create a pass object with receipt data
        object_payload = {
            "id": object_id,
            "classId": f"{self.ISSUER_ID}.receiptClass123",
            "state": "ACTIVE",

            "cardTitle": {
                "defaultValue": {
                    "language": "en-US",
                    "value": receipt_data["establishment_name"]
                }
            },
            
            "header": {
                "defaultValue": {
                    "language": "en-US",
                    "value": f"{receipt_data['type_of_purchase']} Receipt"
                }
            },

            "subheader": {
                "defaultValue": {
                    "language": "en-US",
                    "value": receipt_data["date"]
                }
            },

            "hexBackgroundColor": "#4285f4",

            "logo": {
                "sourceUri": {
                    "uri": "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
                },
                "contentDescription": {
                    "defaultValue": {
                        "language": "en-US",
                        "value": "Project Raseed Logo"
                    }
                }
            },

            "textModulesData": [
                {
                    "header": "Items Purchased",
                    "body": items_text,
                    "id": "items"
                },
                {
                    "header": "Total Amount",
                    "body": f"{receipt_data['total']:.2f}₹",
                    "id": "total"
                }
            ],

            # Add barcode with receipt details
            "barcode": {
                "type": "QR_CODE",
                "value": json.dumps({
                    # "receipt_id": object_id,
                    "establishment": receipt_data["establishment_name"],
                    "date": receipt_data["date"],
                    "type": receipt_data["type_of_purchase"],
                    "total": receipt_data["total"],
                    "items": receipt_data["items"]
                }),
                "alternateText": f"Receipt: {receipt_data['total']:.2f}₹"
            }
        }

        # First create the object via API
        response = requests.post(
            f"{self.BASE_URL}/genericObject",
            headers={
                "Authorization": f"Bearer {self.credentials.token}",
                "Content-Type": "application/json"
            },
            data=json.dumps(object_payload),
        )

        print(f"Object creation: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Pass created successfully!")
            
            # Generate JWT-based save URL
            save_url = self.create_jwt_save_url(object_payload)
            print(f"\n🔗 Save to Google Wallet:")
            print(save_url)
            print("\nCopy this URL and paste it in your browser to add the pass to Google Wallet")
        else:
            print("❌ Error creating pass:")
            print(response.text)
        
        return response

# Usage
if __name__ == "__main__":
    print("Creating Google Wallet pass from receipt data...\n")
    wallet = CreateGeneric()
    wallet.Generic_object(structured_response)