import { useState, useRef } from 'react'
import { useDocument } from '@/contexts/document/DocumentContext'
import { Document } from '@/types/document'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  Button,
  Input,
} from '@/components/shared'
import { DocumentIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export interface DocumentSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (document: Document) => void
  filter?: (document: Document) => boolean
}

export function DocumentSearchModal({
  isOpen,
  onClose,
  onSelect,
  filter,
}: DocumentSearchModalProps) {
  const { documents } = useDocument()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return
    // Create a new document from the file
    const newDocument: Document = {
      id: Date.now().toString(),
      title: selectedFile.name,
      type: 'file',
      category: 'passport_details',
      uploadedAt: new Date().toISOString(),
      metadata: {
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      },
    }
    onSelect(newDocument)
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (filter) {
      return matchesSearch && filter(doc)
    }

    return matchesSearch
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Select Document</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Browse
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <DocumentIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button onClick={handleUpload}>Upload</Button>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(doc)}
              >
                <div className="flex items-start space-x-3">
                  <DocumentIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">{doc.title}</h3>
                    {doc.description && <p className="text-sm text-gray-500">{doc.description}</p>}
                    <p className="text-xs text-gray-400">
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="text-center py-8 text-gray-500">No documents found</div>
            )}
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
