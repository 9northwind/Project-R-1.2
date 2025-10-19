from google.oauth2 import service_account
import google.auth.transport.requests

# Path to your service account JSON key
SERVICE_ACCOUNT_FILE = "wallet-service-key.json"  # change if your filename is different
SCOPES = ["https://www.googleapis.com/auth/wallet_object.issuer"]

# Create credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

# Test: refresh the token
request = google.auth.transport.requests.Request()
credentials.refresh(request)

print("✅ Authentication successful!")
print("Access Token:", credentials.token[:40], "...")  # print first 40 chars
