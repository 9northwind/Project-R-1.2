import "../styles/three.css"
import Feed from "./feed"

export default function Three({ extractedData = [] }) {
    return (
    <div className="three">
        <Feed extractedData={extractedData}/>
    </div>
    )
}