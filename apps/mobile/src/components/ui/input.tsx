import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName, className, leftIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <View className={cn('w-full gap-2', containerClassName)}>
        {label && (
          <Text className="ml-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </Text>
        )}
        <View 
          className={cn(
            'h-14 w-full flex-row items-center rounded-2xl border-2 border-slate-100 bg-slate-50 px-4',
            isFocused && 'border-indigo-500 bg-white shadow-sm',
            error && 'border-rose-500 bg-rose-50',
          )}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn(
              'flex-1 h-full text-base font-medium text-slate-900',
              className
            )}
            placeholderTextColor="#94a3b8"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </View>
        {error && (
          <Text className="ml-1 text-xs font-medium text-rose-500">
            {error}
          </Text>
        )}
      </View>
    );
  }
);
Input.displayName = 'Input';

export { Input };
