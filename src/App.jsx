import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Proprietaires from './pages/Proprietaires'
import Biens from './pages/Biens'
import LocatairesSimple from './pages/LocatairesSimple'
import Paiements from './pages/Paiements'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proprietaires" element={<Proprietaires />} />
          <Route path="/biens" element={<Biens />} />
          <Route path="/locataires" element={<LocatairesSimple />} />
          <Route path="/paiements" element={<Paiements />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App