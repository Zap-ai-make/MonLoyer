function EmptyState({ icon, title, description, actionButton }) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {actionButton && actionButton}
    </div>
  )
}

export default EmptyState