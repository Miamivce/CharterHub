import { useState, useEffect } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { AdminUserModal, AdminUserFormData } from './AdminUserModal'
import { adminService, AdminUser } from '@/services/adminService'

export function AdminUserManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user: currentUser } = useJWTAuth()

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    console.log('AdminUserManagement: Starting to load admin users')
    setIsLoading(true)
    setError(null)

    try {
      // Wrap in a try-catch to prevent any errors from bubbling up
      const data = await adminService.getAdminUsers()
      console.log('AdminUserManagement: Received admin users data', data)

      // If data is an array (even empty), we'll use it
      if (Array.isArray(data)) {
        setAdminUsers(data)

        // If the array is empty, set a user-friendly message but don't treat as error
        if (data.length === 0) {
          setError('No admin users found. You can add new admins using the "Add User" button.')
        }
      } else {
        // Handle unexpected data format
        console.error('AdminUserManagement: Unexpected data format', data)
        setAdminUsers([])
        setError('Unable to load admin users due to unexpected data format.')
      }
    } catch (err) {
      // This should never happen with our updated adminService, but just in case
      console.error('AdminUserManagement: Error loading admin users', err)
      setAdminUsers([])
      setError(err instanceof Error ? err.message : 'Failed to load admin users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (userData: AdminUserFormData) => {
    console.log('AdminUserManagement: Creating user with data:', userData)
    try {
      const createdUser = await adminService.createAdminUser(userData)
      console.log('AdminUserManagement: User created successfully:', createdUser)
      await loadAdminUsers()
      setShowCreateModal(false)
    } catch (err) {
      console.error('AdminUserManagement: Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create admin user')
      throw err // Re-throw to handle in modal
    }
  }

  const handleUpdateUser = async (userData: AdminUserFormData) => {
    if (!selectedUser) return

    try {
      await adminService.updateAdminUser(selectedUser.id.toString(), userData)
      await loadAdminUsers()
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin user')
      throw err
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteClick = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsDeleting(true)
      await adminService.deleteAdminUser(selectedUser.id.toString())
      await loadAdminUsers()
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin user')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Admin Users</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Admin User</span>
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {adminUsers.map((adminUser) => (
            <div key={adminUser.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="h-9 w-9 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {adminUser.firstName} {adminUser.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{adminUser.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(adminUser)}
                    className="p-1 text-gray-400 hover:text-primary rounded-full"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {/* Don't allow deleting your own account */}
                  {currentUser?.id !== adminUser.id && (
                    <button
                      onClick={() => handleDeleteClick(adminUser)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <span>{adminUser.email}</span>
                </div>
                {adminUser.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span>{adminUser.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Admin User Modal */}
      <AdminUserModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSubmit={showEditModal ? handleUpdateUser : handleCreateUser}
        initialData={selectedUser || undefined}
        isEditing={showEditModal}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedUser.firstName} {selectedUser.lastName}? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
