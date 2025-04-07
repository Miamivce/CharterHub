import { useState } from 'react'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/components/shared'

interface VerificationLinkPopupModalProps {
  isOpen: boolean
  onClose: () => void
  link: string
  email?: string
}

export function VerificationLinkPopupModal({
  isOpen,
  onClose,
  link,
  email,
}: VerificationLinkPopupModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setIsCopied(true)
      // Reset copy status after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Customer Registration Link</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <h3 className="text-lg font-medium text-center text-gray-900">
            Customer Created Successfully
          </h3>

          <p className="text-sm text-gray-600">
            Share this registration link with your customer so they can complete their registration:
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50"
            />
            <Button onClick={handleCopyLink} className="flex items-center space-x-1">
              {isCopied ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {email && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-600">
                Customer email: <strong>{email}</strong>
              </p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Share this link with your customer to allow them to create their account. This
                  link will expire in 7 days. Once used, the link will become inactive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  )
}
