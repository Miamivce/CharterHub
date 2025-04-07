import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={cn('container mx-auto px-4 py-8', className)}>{children}</main>
    </div>
  )
}

export function PageHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-8 flex items-center justify-between space-y-2', className)} {...props} />
  )
}

export function PageHeaderHeading({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('text-3xl font-bold tracking-tight', className)} {...props} />
}

export function PageHeaderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-text-secondary', className)} {...props} />
}
