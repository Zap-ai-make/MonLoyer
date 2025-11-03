import { lazy, Suspense, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { NotificationProvider } from './contexts/NotificationContext'
import { DataProvider } from './contexts/DataContext'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import NotificationContainer from './components/NotificationContainer'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import Carte from './pages/Carte'

// Lazy loading des pages pour optimiser le bundle
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Proprietaires = lazy(() => import('./pages/Proprietaires'))
const Biens = lazy(() => import('./pages/Biens'))
const LocatairesSimple = lazy(() => import('./pages/LocatairesSimple'))
const Paiements = lazy(() => import('./pages/Paiements'))
const Documents = lazy(() => import('./pages/Documents'))
const Settings = lazy(() => import('./pages/Settings'))
const Archives = lazy(() => import('./pages/Archives'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

function App() {
  // Log router type for debugging
  useEffect(() => {
    console.log('🔷 Router Type: HashRouter')
    console.log('🔷 Current URL:', window.location.href)
  }, [])

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                  <LoadingSpinner size="large" />
                </div>
              }>
                <Routes>
                  {/* Routes publiques (authentification) */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Routes privées (nécessitent authentification si Firebase configuré) */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Layout><Dashboard /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/proprietaires"
                    element={
                      <PrivateRoute>
                        <Layout><Proprietaires /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/biens"
                    element={
                      <PrivateRoute>
                        <Layout><Biens /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/locataires"
                    element={
                      <PrivateRoute>
                        <Layout><LocatairesSimple /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/paiements"
                    element={
                      <PrivateRoute>
                        <Layout><Paiements /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <PrivateRoute>
                        <Layout><Documents /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/carte"
                    element={
                      <PrivateRoute>
                        <Layout><Carte /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Layout><Settings /></Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/archives"
                    element={
                      <PrivateRoute>
                        <Layout><Archives /></Layout>
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Suspense>
              <NotificationContainer />
            </Router>
          </DataProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App