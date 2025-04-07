import React from 'react'
import { Link, Outlet } from 'react-router-dom'

const TestNav: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold mb-4">CharterHub Test Navigation</h1>
          <nav className="flex space-x-4">
            <Link to="/" className="px-3 py-2 rounded hover:bg-gray-700">
              Home
            </Link>
            <Link to="/test/auth-test" className="px-3 py-2 rounded hover:bg-gray-700">
              Auth Test
            </Link>
            <Link to="/test/wordpress" className="px-3 py-2 rounded hover:bg-gray-700">
              WordPress Test
            </Link>
          </nav>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <Outlet />
      </div>
    </div>
  )
}

export default TestNav
