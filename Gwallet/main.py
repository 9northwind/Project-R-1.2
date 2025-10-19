import sqlite3
import pandas as pd
from llm import llm_model
def init_db():
    # Connect to SQLite (creates db file if not exists)
    conn = sqlite3.connect("receipts.db")
    cursor = conn.cursor()
    
    # Create receipts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipts (
        receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_of_purchase TEXT,
        establishment_name TEXT,
        date TEXT,
        total REAL
         
    )
    """)
    
    # Create receipt_items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipt_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER,
        item_name TEXT,
        quantity REAL,
        price REAL,
        FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id)
    )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")

def insert_values():
    structured_response = llm_model(image_path='20250831_175445.jpg')


    conn=sqlite3.connect("receipts.db")
    cursor = conn.cursor()

    cursor.execute("""
        
        INSERT INTO receipts (type_of_purchase,establishment_name,date,total) VALUES (?,?,?,?)
""",(structured_response.type_of_purchase,structured_response.establishment_name,structured_response.date,structured_response.total))
    

    receipt_id = cursor.lastrowid

    for item in structured_response.items:
        cursor.execute("""
        INSERT INTO receipt_items (receipt_id,item_name,quantity,price) VALUES (?,?,?,?)
                              
""",(receipt_id,item.name,item.quantity,item.price))
        
    conn.commit()
    conn.close()

    print("Added to data base successfully")


    

if __name__ == "__main__":
    # insert_sample()
    print(insert_values())
