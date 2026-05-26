import React from 'react';
import { clsx } from 'clsx';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    gold: 'btn-gold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: '',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(variants[variant], sizes[size] && sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    green: 'badge-green',
    yellow: 'badge-yellow',
    blue: 'badge-blue',
    red: 'badge-red',
    gray: 'badge-gray',
    gold: 'badge-gold',
  };
  return (
    <span className={clsx(variants[variant], className)}>
      {children}
    </span>
  );
};

export const Card = ({ children, className = '', hover = false }) => (
  <div className={clsx(hover ? 'card-hover' : 'card', 'p-5', className)}>
    {children}
  </div>
);

export const Skeleton = ({ className = '', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={clsx('skeleton h-4 w-full', className)} />
    ))}
  </>
);

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={clsx('card relative w-full animate-slide-up max-h-[90vh] overflow-auto', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Konfirmasi', variant = 'danger', loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon || '📭'}</div>
    <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">{title}</h3>
    {description && <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 max-w-sm">{description}</p>}
    {action && action}
  </div>
);

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <svg className={clsx('animate-spin text-emerald-600', sizes[size], className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

export const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <div className="text-4xl">🌙</div>
    <Spinner size="lg" />
    <p className="text-stone-500 dark:text-stone-400 text-sm">Memuat...</p>
  </div>
);

export const Select = ({ children, className = '', ...props }) => (
  <select className={clsx('input', className)} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea rows={3} className={clsx('input resize-none', className)} {...props} />
);

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={clsx('input', className)} {...props} />
));
Input.displayName = 'Input';
