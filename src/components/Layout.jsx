import Sidebar from './Sidebar'
import Logo from './Logo'
import ChatbotPanel from './ChatbotPanel'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [previousSidebarState, setPreviousSidebarState] = useState(false)

  // Auto-collapse sidebar quand chatbot s'ouvre
  useEffect(() => {
    if (chatbotOpen && !sidebarCollapsed) {
      setPreviousSidebarState(sidebarCollapsed)
      setSidebarCollapsed(true)
    } else if (!chatbotOpen && previousSidebarState === false && sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
  }, [chatbotOpen])

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Overlay mobile pour chatbot */}
      {chatbotOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30 transition-opacity duration-300"
          onClick={() => setChatbotOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* Main content */}
      <div className={`w-full md:flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-x-auto ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} ${chatbotOpen ? 'md:mr-[380px]' : ''}`}>
        {/* Header mobile uniquement */}
        <div className="md:hidden bg-white shadow-soft p-4 flex justify-between items-center">
          <Logo size="sm" showText={true} />
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 min-w-0 max-w-[1920px] mx-auto w-full">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>

      {/* Chatbot Panel */}
      <ChatbotPanel
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
    </div>
  )
}

export default Layout