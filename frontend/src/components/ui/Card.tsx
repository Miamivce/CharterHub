import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}
