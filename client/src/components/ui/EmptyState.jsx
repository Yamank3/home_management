export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Icon size={26} className="text-primary-500" />
        </div>
      )}
      <p className="text-base font-semibold text-gray-800">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
