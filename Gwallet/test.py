import json

with open("receipts1.json","r") as file:
    structured_response= json.load(file)
    print(structured_response["type_of_purchase"])
