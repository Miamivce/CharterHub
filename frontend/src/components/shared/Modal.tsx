import { Fragment, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  preventAutoClose?: boolean
  className?: string
  /**
   * Optional z-index for the modal. Defaults to 50.
   * Use higher values for modals that should appear on top of other modals.
   */
  zIndex?: number
}

export function Modal({
  isOpen,
  onClose,
  children,
  preventAutoClose = false,
  className,
  zIndex = 50,
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the close button when the modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)

      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scrolling when modal is closed
      document.body.style.overflow = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key to close the modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventAutoClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, preventAutoClose])

  // Modified handler for backdrop clicks
  const handleBackdropClick = () => {
    // If preventAutoClose is true, don't close the modal when clicking outside
    if (!preventAutoClose) {
      onClose()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`relative z-${zIndex}`}
        onClose={handleBackdropClick}
        static={preventAutoClose} // Prevent closing with escape key if preventAutoClose is true
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`fixed inset-0 bg-black bg-opacity-50`} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  className
                )}
              >
                {!preventAutoClose && (
                  <button
                    className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={onClose}
                    ref={closeButtonRef}
                    aria-label="Close"
                    type="button" // Explicitly set type to prevent form submission
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return <div className={cn('px-6 py-4 border-b', className)}>{children}</div>
}

interface ModalTitleProps {
  children: ReactNode
  className?: string
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>
}

interface ModalContentProps {
  children: ReactNode
  className?: string
}

export function ModalContent({ children, className }: ModalContentProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t bg-gray-50 flex justify-end gap-3', className)}>
      {children}
    </div>
  )
}
