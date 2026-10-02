const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-card',
  secondary: 'bg-surface text-gray-700 border border-gray-200 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-card',
  ghost: 'text-gray-600 hover:bg-gray-100',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2.5',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
