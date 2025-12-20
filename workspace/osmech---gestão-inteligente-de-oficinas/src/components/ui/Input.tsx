import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  uppercase?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  uppercase = false,
  className = '',
  onChange,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uppercase) {
      e.target.value = e.target.value.toUpperCase();
    }
    onChange?.(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full p-3 border rounded-lg outline-none transition-all text-sm
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }
            ${uppercase ? 'uppercase' : ''}
            ${className}
          `}
          onChange={handleChange}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
