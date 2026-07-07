import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types/database';
import { ROLE_LABELS, ROLE_COLORS, getInitials } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: UserRole;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ firstName, lastName, avatarUrl, size = 'md', role, className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-semibold shrink-0',
        'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border border-blue-500/30 text-blue-300',
        SIZE_CLASSES[size],
        className
      )}
      title={`${firstName} ${lastName}${role ? ` (${ROLE_LABELS[role]})` : ''}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${firstName} ${lastName}`} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn('badge', variant === 'outline' && 'bg-transparent', className)}>
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    destructive: 'btn-destructive',
    ghost: 'btn-ghost',
  }[variant];

  return (
    <button
      className={cn(variantClass, BUTTON_SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn('input', error && 'border-red-500/50 focus:ring-red-500', className)}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn('input', error && 'border-red-500/50 focus:ring-red-500', className)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {label}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          className={cn('input resize-none', error && 'border-red-500/50', className)}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div className={cn(hover ? 'card-hover' : 'card', 'animate-fade-in', className)}>
      {children}
    </div>
  );
}

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <svg className={cn('animate-spin text-[hsl(var(--primary))]', sz, className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description?: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {Icon && <Icon className="w-10 h-10 text-[hsl(var(--muted-foreground))] opacity-50" />}
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
      {description && <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-70 max-w-xs">{description}</p>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-[hsl(var(--border))]', className)} />;
}

export function LoadingCard() {
  return (
    <div className="card space-y-3">
      <div className="shimmer h-4 w-1/3 rounded" />
      <div className="shimmer h-3 w-full rounded" />
      <div className="shimmer h-3 w-2/3 rounded" />
    </div>
  );
}

export * from './ParticlesBg';
