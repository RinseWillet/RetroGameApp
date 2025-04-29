import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Pong from './games/Pong.jsx'
import Asteroids from './games/Asteroids.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pong" element={<Pong />} />
        <Route path="/asteroids" element={<Asteroids />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)