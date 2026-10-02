export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 text-base sm:text-sm border rounded-xl outline-none transition-colors bg-surface placeholder:text-gray-400
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
