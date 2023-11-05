import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ArcGISMap from './ArcGISMap'; // Assuming you put the component in a separate file

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
       <ArcGISMap />
  </React.StrictMode>,
)
