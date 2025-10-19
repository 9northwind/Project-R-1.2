import React, { useState } from 'react'
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
    <div className="main-container">

      <Top />
      
      <One onExtracted={handleDataExtracted} />

      <Two />

      <Three extractedData={extractedData} />

    </div>
  )
}

export default App
