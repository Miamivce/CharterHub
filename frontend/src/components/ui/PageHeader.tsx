interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div className="mt-4 flex md:ml-4 md:mt-0">{action}</div>}
    </div>
  )
}
