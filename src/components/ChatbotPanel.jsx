import { useState, useRef, useEffect, useMemo } from 'react'
import { X, Send, Mic, Paperclip, MessageSquarePlus, History, Download, MoreVertical } from 'lucide-react'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import QuickSuggestions from './QuickSuggestions'
import AIAvatar from './AIAvatar'
import IconButton from './IconButton'
import { useTimestamp } from '../hooks/useTimestamp'
import { COLORS, GRADIENT_PRIMARY } from '../constants/colors'
import { useAuth } from '../contexts/AuthContext'

const STORAGE_KEY = 'chatbot_conversations'

const getInitialMessage = (agenceName) => ({
  id: 1,
  type: 'ai',
  message: `👋 Bonjour ${agenceName} ! Comment puis-je vous aider aujourd'hui ?`
})

function ChatbotPanel({ isOpen, onClose }) {
  const getTimestamp = useTimestamp()
  const { agenceData } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showHistoryMenu, setShowHistoryMenu] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Charger les conversations depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed)
        // Charger la dernière conversation
        if (parsed.length > 0) {
          const lastConv = parsed[0]
          setCurrentConversationId(lastConv.id)
          setMessages(lastConv.messages)
        } else {
          startNewConversation()
        }
      } catch (e) {
        startNewConversation()
      }
    } else {
      startNewConversation()
    }
  }, [])

  // Sauvegarder la conversation actuelle quand les messages changent
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const updatedConversations = conversations.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages, updatedAt: new Date().toISOString() }
          : conv
      )

      // Si la conversation n'existe pas encore, l'ajouter
      if (!conversations.find(c => c.id === currentConversationId)) {
        updatedConversations.unshift({
          id: currentConversationId,
          title: messages.find(m => m.type === 'user')?.message.substring(0, 50) || 'Nouvelle conversation',
          messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      // Limiter à 50 conversations maximum (nettoyer les plus anciennes)
      const limitedConversations = updatedConversations.slice(0, 50)

      setConversations(limitedConversations)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedConversations))
    }
  }, [messages, currentConversationId])

  const startNewConversation = () => {
    const newConvId = Date.now().toString()
    const agenceName = agenceData?.nom || 'utilisateur'
    const initialMsg = {
      ...getInitialMessage(agenceName),
      timestamp: getTimestamp()
    }

    setCurrentConversationId(newConvId)
    setMessages([initialMsg])
    setShowSuggestions(true)
    setShowHistoryMenu(false)
  }

  const loadConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setCurrentConversationId(conv.id)
      setMessages(conv.messages)
      setShowSuggestions(false)
      setShowHistoryMenu(false)
    }
  }

  const deleteConversation = (convId) => {
    const updated = conversations.filter(c => c.id !== convId)
    setConversations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    if (convId === currentConversationId) {
      startNewConversation()
    }
  }

  const downloadConversation = () => {
    const conv = conversations.find(c => c.id === currentConversationId)
    if (conv) {
      const text = conv.messages.map(m =>
        `[${m.timestamp}] ${m.type === 'ai' ? 'AOUDIA' : 'Vous'}: ${m.message}`
      ).join('\n\n')

      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversation_${conv.createdAt.split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus sur l'input quand le panneau s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Réponses simulées de l'IA (memoized)
  const aiResponses = useMemo(() => ({
    'comment ajouter un locataire ?': "Pour ajouter un locataire, cliquez sur le bouton '➕ Nouveau Locataire' dans le tableau de bord. Remplissez les informations nécessaires : nom, prénom, téléphone, et sélectionnez le bien à louer. 🏠",
    'voir mes revenus du mois': "Vos revenus du mois sont affichés dans la section 'Finances' du tableau de bord. Vous pouvez y voir les revenus reçus, les montants en attente et votre taux de recouvrement. 💰",
    "conseils d'occupation": "Pour améliorer votre taux d'occupation, je vous recommande de : 1️⃣ Publier vos biens disponibles sur les plateformes locales, 2️⃣ Proposer des visites régulières, 3️⃣ Maintenir vos biens en bon état. 📈",
    default: "Je comprends votre question. Pour l'instant, je suis en phase d'apprentissage. N'hésitez pas à utiliser les suggestions rapides ou à explorer le tableau de bord ! ✨"
  }), [])

  const getAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim()
    return aiResponses[lowerMessage] || aiResponses.default
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Masquer les suggestions après le premier message
    setShowSuggestions(false)

    // Ajouter message utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputValue,
      timestamp: getTimestamp()
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')

    // Montrer l'indicateur de saisie
    setIsTyping(true)

    try {
      // Appeler le webhook n8n
      const webhookUrl = import.meta.env.VITE_AI_WEBHOOK_URL

      if (webhookUrl) {
        const payload = {
          message: currentInput,
          agenceId: agenceData?.uid || 'INCONNU',
          AgenceName: agenceData?.nom || 'Agence Inconnue'
        }

        // Créer un AbortController pour gérer le timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes

        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()

            // Attendre un peu pour une meilleure UX
            await new Promise(resolve => setTimeout(resolve, 500))

            // Extraire la réponse (support de plusieurs formats)
            let responseText = data.response || data.message || data.sortie || data.output || data.text || data.reply

            // Si la réponse est un objet, essayer d'extraire le texte
            if (typeof responseText === 'object' && responseText !== null) {
              responseText = responseText.text || responseText.message || JSON.stringify(responseText)
            }

            // Si toujours pas de texte, utiliser le fallback local
            if (!responseText || typeof responseText !== 'string') {
              responseText = getAIResponse(currentInput)
            }

            setIsTyping(false)
            const aiMessage = {
              id: Date.now() + 1,
              type: 'ai',
              message: responseText,
              timestamp: getTimestamp()
            }
            setMessages(prev => [...prev, aiMessage])
          } else {
            throw new Error('Erreur de réponse du serveur')
          }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw fetchError
        }
      } else {
        // Fallback vers les réponses locales si pas de webhook
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsTyping(false)
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          message: getAIResponse(currentInput),
          timestamp: getTimestamp()
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      // Fallback vers les réponses locales en cas d'erreur
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsTyping(false)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: getAIResponse(currentInput),
        timestamp: getTimestamp()
      }
      setMessages(prev => [...prev, aiMessage])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion)
    // Auto-envoyer après sélection
    const timeoutId = setTimeout(() => {
      handleSendMessage()
    }, 100)

    // Cleanup
    return () => clearTimeout(timeoutId)
  }

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      // Cleanup sera effectué automatiquement au démontage
    }
  }, [])

  return (
    <aside
      role="region"
      aria-label="AOUDIA"
      className={`fixed top-0 right-0 h-screen bg-white flex flex-col transition-all duration-300 ${isOpen ? 'w-full sm:w-[400px] md:w-[380px]' : 'w-0'} overflow-hidden border-l`}
      style={{
        borderColor: COLORS.neutral[100],
        zIndex: 40
      }}
    >
        {/* Header - Style Hostinger */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: GRADIENT_PRIMARY,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Gauche: Avatar + Nom */}
          <div className="flex items-center gap-3">
            <AIAvatar size="md" isTyping={isTyping} />
            <h3 className="text-lg font-bold" style={{ color: COLORS.white, fontFamily: 'Poppins, sans-serif' }}>
              AOUDIA
            </h3>
          </div>

          {/* Droite: Boutons */}
          <div className="flex items-center gap-2">
            {/* Bouton Nouvelle conversation */}
            <button
              onClick={startNewConversation}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-20"
              style={{ color: COLORS.white }}
              title="Nouvelle conversation"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>

            {/* Menu 3 points (Options) */}
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-20"
                style={{ color: COLORS.white }}
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Menu déroulant Options */}
              {showOptionsMenu && (
                <div
                  className="absolute top-full right-0 mt-2 w-56 rounded-lg shadow-xl overflow-hidden z-50"
                  style={{ backgroundColor: COLORS.white }}
                >
                  {/* Option Historique */}
                  <button
                    onClick={() => {
                      setShowHistoryMenu(!showHistoryMenu)
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <History className="w-4 h-4" style={{ color: COLORS.neutral[600] }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.neutral[800] }}>
                      Historique
                    </span>
                  </button>

                  {/* Option Télécharger */}
                  <button
                    onClick={() => {
                      downloadConversation()
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t"
                    style={{ borderColor: COLORS.neutral[100] }}
                  >
                    <Download className="w-4 h-4" style={{ color: COLORS.neutral[600] }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.neutral[800] }}>
                      Télécharger
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-20"
              style={{ color: COLORS.white }}
              aria-label="Fermer le chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu Historique (affiché en dessous du header quand activé) */}
        {showHistoryMenu && (
          <div
            className="border-b"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.neutral[100]
            }}
          >
            <div className="max-h-80 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: COLORS.neutral[500] }}>
                  Aucune conversation sauvegardée
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${conv.id === currentConversationId ? 'bg-blue-50' : ''}`}
                    style={{ borderColor: COLORS.neutral[100] }}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: COLORS.neutral[800] }}>
                          {conv.title}
                        </p>
                        <p className="text-xs mt-1" style={{ color: COLORS.neutral[500] }}>
                          {new Date(conv.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                        }}
                        className="p-1 rounded hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" style={{ color: COLORS.error }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Zone de conversation */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{ backgroundColor: COLORS.white }}
          role="log"
          aria-live="polite"
          aria-label="Messages de conversation"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg.message}
              type={msg.type}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Indicateur de saisie */}
          {isTyping && (
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0">
                <AIAvatar size="sm" isTyping />
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-2"
                style={{
                  backgroundColor: COLORS.neutral[50],
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
              >
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input zone */}
        <div
          className="border-t px-4 py-4"
          style={{ backgroundColor: COLORS.neutral[50], borderColor: COLORS.neutral[100] }}
        >
          {/* Suggestions rapides */}
          {showSuggestions && messages.length === 1 && (
            <QuickSuggestions onSelect={handleSuggestionClick} />
          )}

          {/* Champ de saisie */}
          <div className="flex items-end gap-2">
            {/* Icône microphone */}
            <IconButton
              icon={Mic}
              disabled
              ariaLabel="Enregistrement vocal (bientôt disponible)"
            />

            {/* Input texte */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez une question à AOUDIA…"
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.neutral[800],
                  border: `1px solid ${COLORS.neutral[100]}`,
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '14px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.secondary.DEFAULT
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 148, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.neutral[100]
                  e.currentTarget.style.boxShadow = 'none'
                }}
                aria-label="Saisir un message"
              />

              {/* Icône pièce jointe */}
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all"
                style={{ color: COLORS.neutral[500] }}
                aria-label="Joindre un fichier (bientôt disponible)"
                disabled
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Bouton envoyer */}
            <IconButton
              icon={Send}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              variant="primary"
              ariaLabel="Envoyer le message"
            />
          </div>
        </div>
      </aside>
  )
}

export default ChatbotPanel
