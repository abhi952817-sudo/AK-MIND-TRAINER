import React, { useState } from 'react';
import { COLORS } from '../../types/ludoverse';
import { Loader2, AlertCircle, X, CheckCircle2 } from 'lucide-react';

// ============ SPINNER ============
export const Spinner: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 24,
  color = '#fff',
  className = '',
}) => (
  <div
    className={`rounded-full animate-spin flex-shrink-0 ${className}`}
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}`,
      borderTopColor: 'transparent',
    }}
  />
);

// ============ BUTTONS ============
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  full?: boolean;
  color?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  children,
  onClick,
  disabled,
  loading,
  isLoading,
  full,
  color = COLORS.red,
  className = '',
  type = 'button',
}) => {
  const isBusy = loading || isLoading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isBusy}
      className={`${full ? 'w-full' : ''} h-[52px] rounded-[24px] font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 select-none shadow-md ${className}`}
      style={{
        background: color,
        opacity: disabled || isBusy ? 0.4 : 1,
        cursor: disabled || isBusy ? 'not-allowed' : 'pointer',
      }}
    >
      {isBusy ? <Spinner size={20} color="#fff" /> : children}
    </button>
  );
};

export const OutlineButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, full, className = '', disabled, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${full ? 'w-full' : ''} h-[52px] rounded-[24px] font-semibold border-2 border-[#8D99AE] text-[#8D99AE] active:scale-[0.97] transition-all flex items-center justify-center gap-2 select-none hover:bg-white/5 ${className}`}
    style={{
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

// General Button with variant support
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  loading?: boolean;
  full?: boolean;
  color?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  loading = false,
  children,
  className = '',
  disabled,
  full,
  color,
  ...props
}) => {
  const isBusy = isLoading || loading;
  let baseClasses = `${
    full ? 'w-full' : 'w-full'
  } h-[52px] rounded-[24px] font-semibold text-sm transition-all duration-100 flex items-center justify-center gap-2 select-none active:scale-[0.97]`;

  let customBg = color;
  if (variant === 'primary') {
    customBg = customBg || COLORS.red;
    baseClasses += ' bg-[#E63946] text-white shadow-md hover:brightness-110';
  } else if (variant === 'secondary') {
    baseClasses += ' border-2 border-[#8D99AE] text-[#8D99AE] bg-transparent hover:bg-white/5';
  } else if (variant === 'danger') {
    customBg = customBg || COLORS.error;
    baseClasses += ' bg-[#EF476F] text-white shadow-md hover:brightness-110';
  }

  if (disabled || isBusy) {
    baseClasses += ' opacity-40 cursor-not-allowed pointer-events-none active:scale-100';
  }

  return (
    <button
      className={`${baseClasses} ${className}`}
      disabled={disabled || isBusy}
      style={customBg ? { background: customBg } : undefined}
      {...props}
    >
      {isBusy ? <Spinner size={20} /> : children}
    </button>
  );
};

// ============ TEXT FIELD ============
export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  // Support both React ChangeEvent handler and raw string handler
  onChange?: (e: any) => void;
  type?: string;
  error?: string | null;
  isValid?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  obscure?: boolean;
  isPassword?: boolean;
  onBlur?: () => void;
  className?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  error,
  isValid = false,
  icon,
  leftIcon,
  obscure = false,
  isPassword = false,
  onBlur,
  className = '',
  disabled,
  id,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const isPassField = obscure || isPassword;
  const [show, setShow] = useState(!isPassField);
  const leadingIcon = icon || leftIcon;
  const hasValue = value ? value.length > 0 : false;
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  let borderColor = focused ? COLORS.red : '#8D99AE55';
  if (error) {
    borderColor = COLORS.error;
  } else if (isValid && hasValue) {
    borderColor = COLORS.success;
  }

  return (
    <div className={`w-full flex flex-col mb-4 ${className}`}>
      <div
        className="relative w-full h-[56px] rounded-[12px] border transition-colors flex items-center"
        style={{
          borderColor,
          background: 'transparent',
        }}
      >
        {leadingIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D99AE] flex items-center justify-center pointer-events-none z-10">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          type={isPassField && !show ? 'password' : type}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            if (onChange) {
              onChange(e);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          className={`w-full h-full bg-transparent outline-none px-4 ${
            leadingIcon ? 'pl-12' : ''
          } ${isPassField ? 'pr-12' : ''} text-white font-medium text-sm`}
          {...props}
        />
        <label
          htmlFor={inputId}
          className="absolute pointer-events-none px-1 transition-all rounded"
          style={{
            left: leadingIcon ? 44 : 12,
            top: hasValue || focused ? -10 : '50%',
            transform: hasValue || focused ? 'none' : 'translateY(-50%)',
            fontSize: hasValue || focused ? 11 : 14,
            fontWeight: hasValue || focused ? 600 : 400,
            color: error ? COLORS.error : focused ? COLORS.red : '#8D99AE',
            background: COLORS.bgDark,
          }}
        >
          {label}
        </label>
        {isPassField && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D99AE] text-sm hover:text-white transition-colors"
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] mt-1 ml-1 font-medium flex items-center gap-1" style={{ color: COLORS.error }}>
          <AlertCircle className="w-3 h-3 inline flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

// ============ AVATAR ============
export const Avatar: React.FC<{
  size?: number;
  photoUrl?: string | null;
  name?: string | null;
  color?: string;
  borderColor?: string;
  className?: string;
}> = ({ size = 40, photoUrl, name, color, borderColor, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const initial = name && name.trim().length > 0 ? name.trim()[0].toUpperCase() : null;
  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: color || '#2A2A3E',
        border: borderColor ? `2px solid ${borderColor}` : '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name || ''}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : initial ? (
        <span className="text-white font-bold leading-none select-none" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      ) : (
        <span className="text-[#8D99AE] select-none" style={{ fontSize: size * 0.4 }}>
          👤
        </span>
      )}
    </div>
  );
};

export const AppAvatar = Avatar;

// ============ EMPTY STATE ============
export const EmptyState: React.FC<{
  icon: string | React.ReactNode;
  message?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, message, title, subtitle, actionLabel, actionText, onAction }) => {
  const label = actionLabel || actionText;
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
      <div className="text-5xl opacity-60 flex items-center justify-center">{icon}</div>
      {title && <h4 className="font-semibold text-base text-white">{title}</h4>}
      <p className="text-[#8D99AE] text-sm max-w-[280px]">{message || subtitle}</p>
      {label && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2.5 rounded-full font-semibold text-white text-sm transition-transform active:scale-[0.97]"
          style={{ background: COLORS.red }}
        >
          {label}
        </button>
      )}
    </div>
  );
};

export const EmptyStateWidget = EmptyState;

// ============ SKELETON / SHIMMER ============
export const CoinBadge: React.FC<{
  coins?: number | null;
  className?: string;
  onClick?: () => void;
}> = ({ coins = 0, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${className}`}
    style={{
      background: COLORS.yellow + '22',
      color: COLORS.yellow,
      border: `1px solid ${COLORS.yellow}44`,
    }}
  >
    <span>🪙</span>
    <span>{coins === null ? '–' : typeof coins === 'number' ? coins.toLocaleString() : coins}</span>
  </div>
);

export const Skeleton: React.FC<{
  w?: string | number;
  width?: string | number;
  h?: string | number;
  height?: string | number;
  radius?: number | string;
  className?: string;
}> = ({ w, width, h, height, radius, className = '' }) => (
  <div
    className={`shimmer ${className}`}
    style={{
      width: w ?? width ?? '100%',
      height: h ?? height ?? '100%',
      borderRadius: radius !== undefined ? (typeof radius === 'number' ? `${radius}px` : radius) : '12px',
    }}
  />
);

export const SkeletonBox: React.FC<{
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}> = ({ className = '', width, height, rounded = 'rounded-[12px]' }) => (
  <div
    className={`shimmer ${rounded} ${className}`}
    style={{
      width: width !== undefined ? width : undefined,
      height: height !== undefined ? height : undefined,
    }}
  />
);

// ============ ERROR BANNER ============
export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}> = ({ message, onRetry, onDismiss, className = '' }) => (
  <div
    className={`w-full p-4 rounded-[12px] bg-[#EF476F]/15 border border-[#EF476F]/30 flex items-center justify-between gap-3 ${className}`}
  >
    <div className="flex items-center gap-2.5 text-xs text-[#EF476F] font-medium flex-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EF476F] text-white active:scale-95 transition-transform"
        >
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs font-semibold p-1 text-[#EF476F] hover:text-white active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// ============ TOAST ============
export const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window === 'undefined') return;
  let container = document.getElementById('ludo-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ludo-toast-container';
    container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col gap-2 items-center';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  const bg = type === 'error' ? '#EF476F' : type === 'success' ? '#06D6A0' : '#16213E';
  const color = type === 'success' ? '#0b1329' : '#ffffff';
  el.style.cssText = `background: ${bg}; color: ${color}; padding: 10px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: all 0.3s ease; transform: translateY(20px); opacity: 0;`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.remove();
    }, 300);
  }, 2500);
};

export const Toast: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}> = ({ message, type = 'info', onClose }) => {
  const bg =
    type === 'success'
      ? 'bg-[#06D6A0] text-slate-900'
      : type === 'error'
      ? 'bg-[#EF476F] text-white'
      : 'bg-[#16213E] text-white border border-white/20';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-medium max-w-[90vw] animate-bounce-sub${bg}`}
    >
      {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
      {type === 'error' && <AlertCircle className="w-4 h-4" />}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-1">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ============ CONFIRM DIALOG ============
export const ConfirmDialog: React.FC<{
  isOpen?: boolean;
  open?: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const visible = open !== undefined ? open : isOpen;
  if (!visible) return null;

  const isDanger = destructive || isDestructive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xs bg-[#16213E] border border-white/10 rounded-[20px] p-5 shadow-2xl flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
          {message && <p className="text-xs text-[#8D99AE] leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-[42px] rounded-[14px] border border-white/10 text-xs font-semibold text-[#8D99AE] active:scale-95 transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-[42px] rounded-[14px] text-xs font-semibold text-white active:scale-95 transition-transform ${
              isDanger ? 'bg-[#EF476F]' : 'bg-[#E63946]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
