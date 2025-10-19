import "../styles/two.css";
import { useState, useEffect, useRef } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";

export default function Two() {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const displayRef = useRef(null);

  useEffect(() => {
    const receiptsCol = collection(db, "receipts");
    const q = query(receiptsCol, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const receipt = doc.data();
          const itemsCol = collection(db, "receipts", doc.id, "items");
          const itemsSnapshot = await getDocs(itemsCol);
          const items = itemsSnapshot.docs.map((itemDoc) => itemDoc.data());
          return { id: doc.id, ...receipt, items };
        })
      );
      setReceipts(data);
    });

    return () => unsubscribe();
  }, []);

const serializeReceipts = (receipts) => {
  return receipts.map(r => {
    const copy = { ...r };
    if (copy.created_at && copy.created_at.toDate) {
      try {
        copy.created_at = copy.created_at.toDate().toISOString();
      } catch {
        copy.created_at = String(copy.created_at);
      }
    }
    if (copy.items) {
      copy.items = copy.items.map(it => ({ ...it }));
    }
    return copy;
  });
};

const handleSend = async () => {
  if (!prompt.trim()) return;
  setChat(prev => [...prev, { type: "user", text: prompt }]);

  try {
    const payload = { prompt, receipts: serializeReceipts(receipts) };
    const response = await fetch("http://localhost:8000/llm-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`HTTP ${response.status}: ${txt}`);
    }

    const data = await response.json();
    const replyText = data.reply || "No reply from LLM.";
    setChat(prev => [...prev, { type: "llm", text: replyText }]);
  } catch (err) {
    console.error("Error calling LLM:", err);
    setChat(prev => [...prev, { type: "llm", text: `Error: ${err.message}` }]);
  }

  setPrompt("");
};


  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="two">
      <div className="display" ref={displayRef}>
        {chat.map((msg, idx) => (
          <div key={idx} className={msg.type === "user" ? "user" : "llm"}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat">
        <input
          className="text"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send" onClick={handleSend}>
          <span className="material-symbols-outlined-send">send</span>
        </button>
      </div>
    </div>
  );
}
