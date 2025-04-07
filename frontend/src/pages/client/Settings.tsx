import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { Card } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Settings() {
  const { user, logout } = useJWTAuth()
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Preferences</label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    id="marketing"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketing" className="ml-2 block text-sm text-gray-900">
                    Receive marketing emails
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="notifications"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                    Receive booking notifications
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 rounded-md">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time Zone</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 rounded-md">
                <option>Pacific Time (PT)</option>
                <option>Mountain Time (MT)</option>
                <option>Central Time (CT)</option>
                <option>Eastern Time (ET)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                /* TODO: Implement profile edit handler */
              }}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                /* TODO: Implement password change handler */
              }}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="danger"
              className="w-full justify-center"
              onClick={() => setShowConfirmation(true)}
            >
              Delete Account
            </Button>

            {showConfirmation && (
              <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
                <p className="text-sm text-red-600 font-medium mb-2">
                  Are you sure you want to delete your account?
                </p>
                <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    className="flex-1 justify-center"
                    onClick={() => {
                      /* TODO: Implement account deletion logic */
                      alert('Account deletion is not implemented in this version')
                      setShowConfirmation(false)
                    }}
                  >
                    Yes, Delete Account
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
