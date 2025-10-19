import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

export async function saveReceipt(receiptData) {
  try {
    const docRef = await addDoc(collection(db, "receipts"), {
      type_of_purchase: receiptData.type_of_purchase || "",
      establishment_name: receiptData.establishment_name || "",
      date: receiptData.date || "",
      total: receiptData.total || 0,
      created_at: serverTimestamp()
    });

    for (const item of receiptData.items || []) {
      await addDoc(collection(db, "receipts", docRef.id, "items"), {
        item_name: item.name || "",
        price: item.price || 0,
        quantity: item.quantity || 0
      });
    }

    return docRef.id;
  } catch (err) {
    console.error("Error saving receipt:", err);
    return null;
  }
}
