import { useState, memo } from 'react'
import { Info } from 'lucide-react'

const Tooltip = memo(function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="cursor-help"
      >
        {children || <Info className="w-4 h-4 text-neutral-500 hover:text-primary transition-colors" />}
      </div>

      {visible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 px-3 py-2 bg-neutral-800 text-white text-sm rounded-lg shadow-soft-lg whitespace-nowrap animate-fade-in pointer-events-none`}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-neutral-800 rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
})

export default Tooltip
