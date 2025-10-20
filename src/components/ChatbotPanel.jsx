import { useState, useRef, useEffect, useMemo } from 'react'
import { X, Send, Mic, Paperclip } from 'lucide-react'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import QuickSuggestions from './QuickSuggestions'
import AIAvatar from './AIAvatar'
import IconButton from './IconButton'
import { useTimestamp } from '../hooks/useTimestamp'
import { COLORS, GRADIENT_PRIMARY } from '../constants/colors'

const INITIAL_MESSAGE = {
  id: 1,
  type: 'ai',
  message: "👋 Bonjour ! Je suis AOUDIA. Comment puis-je vous aider aujourd'hui ?"
}

function ChatbotPanel({ isOpen, onClose }) {
  const getTimestamp = useTimestamp()
  const [messages, setMessages] = useState([
    {
      ...INITIAL_MESSAGE,
      timestamp: getTimestamp()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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

  const handleSendMessage = () => {
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

    // Simuler l'IA qui tape
    setIsTyping(true)

    // Ajouter réponse de l'IA après délai
    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: getAIResponse(currentInput),
        timestamp: getTimestamp()
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1500)

    // Cleanup sera géré par useEffect
    return () => clearTimeout(timeoutId)
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: GRADIENT_PRIMARY,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            <AIAvatar size="md" isTyping={isTyping} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.white, fontFamily: 'Poppins, sans-serif' }}>
                AOUDIA
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Je suis là pour vous aider à gérer vos biens 👋
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-20"
            style={{ color: COLORS.white }}
            aria-label="Fermer le chatbot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
