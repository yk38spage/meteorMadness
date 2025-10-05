import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './assets/Input/Input.css'
import { Outlet, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './views/Home/Homepage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
            </Routes>
        </Router>
    )
}

export default App
