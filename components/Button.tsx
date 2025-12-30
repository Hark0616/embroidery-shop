import React, { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string;
  rel?: string;
  fullWidth?: boolean;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  href,
  children,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center 
    font-body font-normal
    transition-all duration-300 
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: 'bg-jungle-deep text-mint hover:bg-jungle',
    outline: 'border border-jungle-deep text-jungle-deep hover:bg-jungle-deep hover:text-mint',
    ghost: 'text-jungle-deep hover:text-jungle',
    underline: 'text-jungle-deep border-b border-jungle-deep/20 hover:border-jungle-deep/60 pb-2'
  };

  const sizes = {
    sm: 'px-5 py-2 text-xs tracking-[0.15em] uppercase',
    md: 'px-7 py-3 text-xs tracking-[0.2em] uppercase',
    lg: 'px-10 py-4 text-xs tracking-[0.25em] uppercase'
  };

  // Underline variant doesn't need padding
  const sizeStyles = variant === 'underline' 
    ? 'text-xs tracking-[0.25em] uppercase' 
    : sizes[size];

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizeStyles}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  if (href) {
    return (
      <Link href={href} className={classes} target={props.target} rel={props.rel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
