import "../styles/bottom.css"
import { useNavigate } from 'react-router-dom';

export default function Bottom() {

    const navigate = useNavigate();
    return(
        <div className="bottom-container">
            <div className="buttons">

                <button onClick={() => navigate("/chat")}>
                    <span className="material-symbols-outlined">network_intel_node</span>
                </button>

                <button onClick={() => navigate("/")}>
                    <span className="material-symbols-outlined">home</span>
                </button>

                <button onClick={() => navigate("/receipts")}>
                    <span className="material-symbols-outlined">request_page</span>
                </button>
            </div>
        </div>
    )
}