import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    variant === 'danger' && 'btn-danger',
    variant === 'success' && 'btn-success',
    variant === 'ghost' && 'btn-ghost',
    variant === 'icon' && 'btn-icon',
    size === 'sm' && 'text-sm',
    size === 'md' && 'text-sm',
    size === 'lg' && 'text-base',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button aria-pressed="false" className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon && <span className="inline-flex items-center mr-2">{leftIcon}</span>
      )}

      {children}

      {!isLoading && rightIcon && <span className="inline-flex items-center ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
