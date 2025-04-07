import React, { useState, useEffect } from 'react';
import { useJWTAuth } from '../../contexts/auth/JWTAuthContext';
import type { User } from '../../types';

// Define UserProfileUpdateData type locally since we don't have access to the auth types
interface UserProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  company?: string;
}

const Profile: React.FC = () => {
  const { user, updateProfile, loading, errors } = useJWTAuth();
  const isLoading = loading?.updateProfile || false;
  const error = errors?.updateProfile?.message || null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfileUpdateData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        company: user.company || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      setFormError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  if (loading?.login) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Please log in to view your profile</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-4">
            {(error || formError) && (
              <div className="mb-4 text-red-500 text-sm text-center">
                {error || formError}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support for assistance.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`${
                      isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-4 py-2 rounded transition-colors`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-500">First Name</div>
                    <div className="mt-1">{user.firstName}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Last Name</div>
                    <div className="mt-1">{user.lastName}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="mt-1">{user.email}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Phone Number</div>
                    <div className="mt-1">{user.phoneNumber || 'Not specified'}</div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-gray-500">Company</div>
                    <div className="mt-1">{user.company || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Role</div>
                    <div className="mt-1 capitalize">{user.role}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Account Status
                    </div>
                    <div className="mt-1">
                      {user.verified ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-yellow-600">Pending Verification</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 