export default function Checkbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer accent-indigo-600"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
