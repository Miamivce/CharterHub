import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface DropdownProps {
  children: ReactNode
  className?: string
}

export function Dropdown({ children, className }: DropdownProps) {
  return (
    <div
      className={cn(
        'absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-full',
        className
      )}
    >
      {children}
    </div>
  )
}

export interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function DropdownItem({
  children,
  onClick,
  className,
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}
