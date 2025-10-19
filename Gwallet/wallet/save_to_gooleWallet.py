import jwt
import json
import datetime

with open("wallet-service-key.json","r") as f:
    service_account_info=json.load(f)

# Build JWT
jwt_payload = {
    "iss": service_account_info["client_email"],  # issuer
    "aud": "google",
    "typ": "savetowallet",
    "iat": int(datetime.datetime.now().timestamp()),
    "payload": {
        "genericObjects": [
            {
                "id": "3388000000023012969.receiptClass123"
            }
        ]
    }
}

signed_jwt = jwt.encode(jwt_payload, service_account_info["private_key"], algorithm="RS256")

save_link = f"https://pay.google.com/gp/v/save/{signed_jwt}"
print("Save link:", save_link)