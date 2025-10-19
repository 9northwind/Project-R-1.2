import "../styles/feed.css"
import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";

export default function Feed() {
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    const receiptsCol = collection(db, "receipts");
    const q = query(receiptsCol, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (doc) => {
        const receipt = doc.data();

        const itemsCol = collection(db, "receipts", doc.id, "items");
        const itemsSnapshot = await getDocs(itemsCol);
        const items = itemsSnapshot.docs.map((itemDoc) => itemDoc.data());

        return { id: doc.id, ...receipt, items };
      }));

      setReceipts(data);
    });

    return () => unsubscribe();
  }, []);

  if (receipts.length === 0) return <p className="empty-msg">No receipts found</p>;

  return (
    <div className="feed-container">
      <div className="feed-grid">
        {receipts.map((r) => (
          <div className="wallet-card" key={r.id}>
            <div className="wallet-header">
              <span className="material-symbols-outlined">receipt_long</span>
              <h3>{r.establishment_name || "Unknown Store"}</h3>
            </div>
            <div className="wallet-body">
              <p><strong>Total:</strong> ₹{r.total}</p>
              <p><strong>Date:</strong> {r.date}</p>
              <ul>
                {r.items?.map((i, idx) => (
                  <li key={idx}>{i.item_name || i.name} x{i.quantity} - ₹{i.price}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
