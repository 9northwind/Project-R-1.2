import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Top from './components/top';
import One from './components/one';
import Two from './components/two';
import Three from './components/three';
import './App.css'

function App() {

  const [extractedData, setExtractedData] = useState([])

  const handleDataExtracted = (data) => {
    const dataArray = Array.isArray(data) ? data : [data]
    setExtractedData(dataArray)
  }

  return (
    <Router >
      <Routes>

        <Route path="/" element={<One onExtracted={handleDataExtracted} />} />
        <Route path="/chat" element={<Two />} />

        <Route path="/receipts" element={<Three extractedData={extractedData} />} />

      </Routes>
    </Router> 
    
  )
}

export default App
