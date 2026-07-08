import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-2xl px-4 active:opacity-70 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 shadow-lg shadow-indigo-200',
        destructive: 'bg-rose-500 shadow-lg shadow-rose-200',
        outline: 'border-2 border-slate-200 bg-white',
        secondary: 'bg-slate-100',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
        glass: 'bg-white/20 backdrop-blur-md border border-white/30',
      },
      size: {
        default: 'h-14',
        sm: 'h-10 px-3',
        lg: 'h-16 px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const textVariants = cva('font-bold tracking-tight', {
  variants: {
    variant: {
      default: 'text-white',
      destructive: 'text-white',
      outline: 'text-slate-900',
      secondary: 'text-slate-900',
      ghost: 'text-slate-900',
      link: 'text-indigo-600 underline',
      glass: 'text-white',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  loading?: boolean;
  textClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, label, loading, children, textClassName, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#4f46e5' : 'white'} />
        ) : (
          <View className="flex-row items-center justify-center gap-2">
            {leftIcon}
            {children}
            {label && (
              <Text className={cn(textVariants({ variant, size }), textClassName)}>
                {label}
              </Text>
            )}
            {rightIcon}
          </View>
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
