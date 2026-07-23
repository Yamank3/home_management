export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-white
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
