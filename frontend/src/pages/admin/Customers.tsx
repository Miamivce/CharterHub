import { useState, useEffect } from 'react'
import { CustomerWithStats, ClientUser } from '@/contexts/types'
import { customerService } from '@/services/customerService'
import { useDocument } from '@/contexts/document/DocumentContext'
import {
  CreateCustomerModal,
  CustomerModalResult,
  CUSTOMER_UPDATED_EVENT,
  CUSTOMER_CREATED_EVENT,
} from '@/components/customer/CreateCustomerModal'
import { VerificationLinkPopupModal } from '@/components/customer/VerificationLinkPopupModal'
import { Button, Card, Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/shared'
import {
  PlusIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PencilIcon,
  DocumentIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  CheckIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { DocumentSearchModal } from '@/components/shared/DocumentSearchModal'
import { Document } from '@/types/document'
import { useNavigate } from 'react-router-dom'
import { CustomerFormData, Customer } from '@/types/customer'

/**
 * The workflow states for the customer management process
 */
enum CustomerWorkflowState {
  IDLE = 'idle', // No active workflow
  CREATING = 'creating', // Creating a new customer
  SHOWING_INVITE = 'showing_invite', // Showing invite link after creation
  EDITING = 'editing', // Editing an existing customer
  ATTACHING_DOCUMENT = 'attaching_document', // Attaching passport to customer
  CONFIRMING_DELETE = 'confirming_delete', // Confirming customer deletion
}

// Interface to track invitation status for each customer
interface CustomerInvitationStatus {
  isLoading: boolean
  hasInvitations: boolean
  hasActiveInvitation: boolean
  isUsed: boolean
}

export function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { documents } = useDocument()
  const navigate = useNavigate()

  // Workflow state management
  const [workflowState, setWorkflowState] = useState<CustomerWorkflowState>(
    CustomerWorkflowState.IDLE
  )
  const [inviteLink, setInviteLink] = useState('')
  const [createdCustomerEmail, setCreatedCustomerEmail] = useState('')

  // Track invitation status for each customer
  const [invitationStatuses, setInvitationStatuses] = useState<
    Record<string, CustomerInvitationStatus>
  >({})

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOption, setFilterOption] = useState<string>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string | number>>(new Set())
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Load customers on mount
  useEffect(() => {
    console.log('Customers component mounted, loading initial customer data')
    loadCustomers()

    // Set up periodic refresh to ensure customers list stays updated
    const refreshInterval = setInterval(() => {
      console.log('Periodic refresh triggered: fetching latest customer data')
      refreshCustomers()
    }, 30000) // Refresh every 30 seconds

    // Set up event listeners for customer updates
    const handleCustomerUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[Customers] Received customer:updated event:', customEvent.detail)

      // Verify the event source and data
      if (customEvent.detail?.source === 'CreateCustomerModal' && customEvent.detail?.customer) {
        // Extract the updated customer from the event
        const updatedCustomer = customEvent.detail.customer
        console.log('[Customers] Processing update for customer ID:', updatedCustomer.id)

        // Update the local state immediately for UI responsiveness
        setCustomers((prevCustomers) => {
          // Check if the customer already exists in our list
          const index = prevCustomers.findIndex((c) => c.id === updatedCustomer.id)

          if (index !== -1) {
            // Customer exists, create a new array with the updated customer
            console.log('[Customers] Updating existing customer in state')
            const newCustomers = [...prevCustomers]

            // Preserve existing fields that might not be in the update
            const existingCustomer = prevCustomers[index]
            newCustomers[index] = {
              ...existingCustomer, // Keep existing fields
              ...updatedCustomer, // Apply updates
              // Keep stats which might not be in the update
              bookingsCount: existingCustomer.bookingsCount,
              totalSpent: existingCustomer.totalSpent,
              lastBooking: existingCustomer.lastBooking,
            }

            return newCustomers
          } else {
            // Customer doesn't exist in our list, add it
            console.log('[Customers] Adding new customer to state from update event')
            return [
              ...prevCustomers,
              {
                ...updatedCustomer,
                bookingsCount: 0,
                totalSpent: 0,
                lastBooking: undefined,
                role: 'client' as 'client',
              },
            ]
          }
        })

        // Also trigger a background refresh to ensure all data is in sync
        setTimeout(() => forceRefreshCustomers(), 1000)
      }
    }

    const handleCustomerCreated = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[Customers] Received customer:created event:', customEvent.detail)

      // Verify the event source and data
      if (customEvent.detail?.source === 'CreateCustomerModal' && customEvent.detail?.customer) {
        // Force refresh the customer list
        forceRefreshCustomers()

        // Add the new customer to the local state
        setCustomers((prevCustomers) => {
          if (!prevCustomers.some((c) => c.id === customEvent.detail.customer.id)) {
            return [...prevCustomers, customEvent.detail.customer]
          }
          return prevCustomers
        })
      }
    }

    window.addEventListener(CUSTOMER_UPDATED_EVENT, handleCustomerUpdated)
    window.addEventListener(CUSTOMER_CREATED_EVENT, handleCustomerCreated)

    return () => {
      console.log('Customers component unmounting, clearing refresh interval and event listeners')
      clearInterval(refreshInterval)
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, handleCustomerUpdated)
      window.removeEventListener(CUSTOMER_CREATED_EVENT, handleCustomerCreated)
    }
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      console.log('=== Admin Customers: loadCustomers started ===')
      const data = await customerService.getCustomers()
      console.log(`Loaded ${data.length} customers from customerService`)

      // Convert Customer[] to CustomerWithStats[]
      const customersWithStats: CustomerWithStats[] = data.map((customer) => ({
        ...customer,
        bookingsCount: customer.bookings || 0,
        totalSpent: 0, // This will be updated by the backend
        lastBooking: undefined,
        // Ensure role is the expected type
        role: 'client' as 'client',
      }))

      // Log details about customer types for debugging
      const adminCreated = customersWithStats.filter((c) => c.selfRegistered === false).length
      const selfRegistered = customersWithStats.filter((c) => c.selfRegistered === true).length
      const unspecified = customersWithStats.filter((c) => c.selfRegistered === undefined).length

      console.log(
        `Customer breakdown - Admin created: ${adminCreated}, Self registered: ${selfRegistered}, Unspecified: ${unspecified}`
      )

      setCustomers(customersWithStats)

      // Check invitation status for all customers
      customersWithStats.forEach(checkCustomerInvitationStatus)

      console.log('=== Admin Customers: loadCustomers completed ===')
    } catch (err) {
      console.error('Failed to load customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCustomers = async () => {
    try {
      console.log('=== Admin Customers: refreshCustomers started ===')
      const data = await customerService.getCustomers()

      // Convert Customer[] to CustomerWithStats[]
      const updatedCustomers: CustomerWithStats[] = data.map((customer) => ({
        ...customer,
        bookingsCount: customer.bookings || 0,
        totalSpent: 0, // This will be updated by the backend
        lastBooking: undefined,
        // Ensure role is the expected type
        role: 'client' as 'client',
      }))

      console.log(`Refreshed with ${updatedCustomers.length} customers from customerService`)

      // Compare if there are actual changes before updating state
      const currentIds = new Set(customers.map((c) => c.id))
      const newCustomers = updatedCustomers.filter((c) => !currentIds.has(c.id))

      if (newCustomers.length > 0) {
        console.log(`Found ${newCustomers.length} new customers during refresh`)
        setCustomers(updatedCustomers)

        // Check invitation status for new customers
        newCustomers.forEach(checkCustomerInvitationStatus)
      } else {
        // Check for changes in existing customers
        const hasChanges = updatedCustomers.some((updatedCustomer) => {
          const existingCustomer = customers.find((c) => c.id === updatedCustomer.id)
          if (!existingCustomer) return false
          return JSON.stringify(updatedCustomer) !== JSON.stringify(existingCustomer)
        })

        if (hasChanges) {
          console.log('Found changes in existing customer data, updating state')
          setCustomers(updatedCustomers)
        } else {
          console.log('No changes detected in customer data')
        }
      }
    } catch (err) {
      console.error('Error refreshing customers:', err)
    }
  }

  // Add a function to ensure customers are refreshed reliably
  const forceRefreshCustomers = async (attempts = 3, delay = 1000) => {
    console.log(`Attempting to force refresh customers list (attempts left: ${attempts})`)

    try {
      // Clear the cache to ensure we get fresh data
      customerService.clearCustomerCache()

      // Load customers with force refresh flag
      const data = await customerService.getCustomers(true)
      console.log(`Force refreshed ${data.length} customers from customerService`)

      // Convert Customer[] to CustomerWithStats[] - handling type conversion
      const customersWithStats = data.map((customer) => ({
        ...customer,
        bookingsCount: customer.bookings || 0,
        totalSpent: 0,
        lastBooking: undefined,
        // Ensure role is the expected type
        role: 'client' as 'client',
      }))

      setCustomers(customersWithStats)
      console.log('Customer list successfully refreshed')

      return true
    } catch (err) {
      console.error('Error during force refresh:', err)

      // Try again if we have attempts left
      if (attempts > 1) {
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return forceRefreshCustomers(attempts - 1, delay * 1.5)
      }

      return false
    }
  }

  // Handle completion of customer creation/editing
  const handleCustomerComplete = async (result: CustomerModalResult) => {
    console.log(`Customer ${result.action}: ${result.customer.id}`)

    // Make sure we have a non-null invite link before proceeding to show it
    const hasValidInviteLink = result.inviteLink && typeof result.inviteLink === 'string'

    if (result.action === 'created' && hasValidInviteLink) {
      // For creation with invite link, show the verification popup
      console.log('Customer created with invite link, showing verification popup')
      setInviteLink(result.inviteLink as string)
      setCreatedCustomerEmail(result.customer.email)

      // Change workflow state to showing invite, which closes CreateCustomerModal and opens verification popup
      setWorkflowState(CustomerWorkflowState.SHOWING_INVITE)

      // Refresh the customers list in the background
      setTimeout(() => forceRefreshCustomers(), 1000)
    } else if (!result.keepModalOpen) {
      // Only close the workflow if the modal doesn't need to stay open
      console.log('Customer updated or created without invite, closing workflow')
      resetWorkflow()

      // Force refresh customer list to ensure we have the latest data
      await forceRefreshCustomers()

      // Check invitation status for any new customers
      if (result.action === 'created') {
        const customerId =
          typeof result.customer.id === 'number'
            ? result.customer.id.toString()
            : result.customer.id

        // Give the server a moment to process any changes
        setTimeout(
          () =>
            checkCustomerInvitationStatus({
              ...result.customer,
              bookingsCount: 0,
              totalSpent: 0,
              role: 'client' as 'client',
            } as CustomerWithStats),
          1500
        )
      }
    } else {
      // Modal should stay open (keepModalOpen is true)
      console.log('Customer created - keeping modal open as requested for invite generation')

      // Force refresh customer list in the background
      forceRefreshCustomers()

      // Check invitation status for new customer
      if (result.action === 'created') {
        const customerId =
          typeof result.customer.id === 'number'
            ? result.customer.id.toString()
            : result.customer.id

        setTimeout(
          () =>
            checkCustomerInvitationStatus({
              ...result.customer,
              bookingsCount: 0,
              totalSpent: 0,
              role: 'client' as 'client',
            } as CustomerWithStats),
          1500
        )
      }
    }
  }

  // Reset the workflow state machine
  const resetWorkflow = () => {
    console.log('Resetting customer workflow state machine')
    setWorkflowState(CustomerWorkflowState.IDLE)
    setSelectedCustomer(null)
    setInviteLink('')
    setCreatedCustomerEmail('')
    setError(null)
  }

  const handleViewCustomer = (customer: CustomerWithStats) => {
    const customerId = typeof customer.id === 'number' ? customer.id.toString() : customer.id
    navigate(`/admin/customers/${customerId}`)
  }

  const handleEditCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setWorkflowState(CustomerWorkflowState.EDITING)
  }

  const handleAttachPassport = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setWorkflowState(CustomerWorkflowState.ATTACHING_DOCUMENT)
  }

  const handleDocumentSelect = async (document: Document) => {
    if (!selectedCustomer) return

    try {
      await customerService.attachPassport(String(selectedCustomer.id), document.id)
      // Refresh customer data to show updated passport info
      await forceRefreshCustomers()
      resetWorkflow()
    } catch (err) {
      console.error('Failed to attach passport:', err)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, customer: CustomerWithStats) => {
    e.stopPropagation() // Prevent the card click event from firing
    setSelectedCustomer(customer)
    setWorkflowState(CustomerWorkflowState.CONFIRMING_DELETE)
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return

    try {
      setIsDeleting(true)
      await customerService.deleteCustomer(String(selectedCustomer.id))

      // Refresh the customer list
      await forceRefreshCustomers()

      resetWorkflow()
    } catch (err) {
      console.error('Failed to delete customer:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Function to check invitation status for a customer
  const checkCustomerInvitationStatus = async (customer: CustomerWithStats) => {
    const customerId = typeof customer.id === 'number' ? customer.id.toString() : customer.id

    try {
      // Update loading state
      setInvitationStatuses((prev) => ({
        ...prev,
        [customerId]: {
          ...prev[customerId],
          isLoading: true,
        },
      }))

      // Fetch invitation status
      const status = await customerService.checkInvitationStatus(customerId)

      // Update state with results
      setInvitationStatuses((prev) => ({
        ...prev,
        [customerId]: {
          isLoading: false,
          hasInvitations: status.hasInvitations,
          hasActiveInvitation: status.hasActiveInvitation,
          isUsed: status.hasInvitations && !status.hasActiveInvitation,
        },
      }))
    } catch (error) {
      console.error(`Failed to check invitation status for customer ${customerId}:`, error)

      // Update state to show error
      setInvitationStatuses((prev) => ({
        ...prev,
        [customerId]: {
          ...prev[customerId],
          isLoading: false,
        },
      }))
    }
  }

  // Filter and sort customers based on search query and filter options
  const filteredCustomers = (() => {
    let result = [...customers]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (customer) =>
          customer.firstName?.toLowerCase().includes(query) ||
          customer.lastName?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.company?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query)
      )
    }

    // Apply sort based on filter option
    if (filterOption === 'firstName') {
      result.sort((a, b) => {
        const nameA = a.firstName?.toLowerCase() || ''
        const nameB = b.firstName?.toLowerCase() || ''
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    } else if (filterOption === 'lastName') {
      result.sort((a, b) => {
        const nameA = a.lastName?.toLowerCase() || ''
        const nameB = b.lastName?.toLowerCase() || ''
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    } else if (filterOption === 'date') {
      result.sort((a, b) => {
        // Use registrationDate which exists on CustomerWithStats
        const dateA = a.registrationDate || new Date(0).toISOString()
        const dateB = b.registrationDate || new Date(0).toISOString()
        return sortDirection === 'asc'
          ? new Date(dateA).getTime() - new Date(dateB).getTime()
          : new Date(dateB).getTime() - new Date(dateA).getTime()
      })
    } else if (filterOption === 'bookings') {
      result.sort((a, b) =>
        sortDirection === 'asc'
          ? (a.bookingsCount || 0) - (b.bookingsCount || 0)
          : (b.bookingsCount || 0) - (a.bookingsCount || 0)
      )
    }

    return result
  })()

  // Toggle selection of a customer for bulk actions
  const toggleCustomerSelection = (e: React.MouseEvent, customerId: string | number) => {
    e.stopPropagation()
    const newSelected = new Set(selectedCustomers)

    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }

    setSelectedCustomers(newSelected)
  }

  // Toggle selection of all customers
  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map((c) => c.id)))
    }
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    setIsBulkActionOpen(false)

    if (action === 'delete') {
      setShowBulkDeleteConfirm(true)
    } else if (action === 'export') {
      // Create CSV data
      const selectedCustomerData = filteredCustomers.filter((c) => selectedCustomers.has(c.id))

      let csvContent = 'data:text/csv;charset=utf-8,'
      csvContent += 'First Name,Last Name,Email,Phone,Company,Bookings Count\n'

      selectedCustomerData.forEach((customer) => {
        csvContent += `${customer.firstName || ''},${customer.lastName || ''},${customer.email || ''},${customer.phone || ''},${customer.company || ''},${customer.bookingsCount || 0}\n`
      })

      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'customer_export.csv')
      document.body.appendChild(link)

      // Trigger download
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) return

    setIsBulkDeleting(true)

    try {
      // Delete each selected customer
      const customerIds = Array.from(selectedCustomers)

      for (const id of customerIds) {
        await customerService.deleteCustomer(String(id))
      }

      // Clear customer service cache
      customerService.clearCustomerCache()

      // Refresh the customer list
      await forceRefreshCustomers()

      // Clear selected customers
      setSelectedCustomers(new Set())
      setShowBulkDeleteConfirm(false)

      console.log(`Successfully deleted ${customerIds.length} customers`)
    } catch (err) {
      console.error('Error in bulk delete:', err)
      alert('Failed to delete some customers. Please try again.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Clear all filters and selections
  const clearFilters = () => {
    setSearchQuery('')
    setFilterOption('date')
    setSortDirection('desc')
    setSelectedCustomers(new Set())
  }

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer base and their information
          </p>
        </div>
        <Button
          onClick={() => setWorkflowState(CustomerWorkflowState.CREATING)}
          disabled={workflowState !== CustomerWorkflowState.IDLE}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={toggleSortDirection}
            >
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>

          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="firstName">Sort by First Name</option>
              <option value="lastName">Sort by Last Name</option>
              <option value="date">Sort by Date Added</option>
              <option value="bookings">Sort by Bookings</option>
            </select>
          </div>

          {(searchQuery ||
            filterOption !== 'date' ||
            sortDirection !== 'desc' ||
            selectedCustomers.size > 0) && (
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar - Only show when customers are selected */}
      {selectedCustomers.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={
                selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0
              }
              onChange={toggleSelectAll}
            />
            <span className="ml-2 text-sm text-gray-700">
              {selectedCustomers.size} {selectedCustomers.size === 1 ? 'customer' : 'customers'}{' '}
              selected
            </span>
          </div>

          <div className="relative">
            <button
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
            >
              Bulk Actions
              <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </button>

            {isBulkActionOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No customers match your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-6 hover:bg-gray-50 transition-colors relative">
              {/* Checkbox for bulk selection */}
              <div
                className="absolute top-2 left-2 h-5 w-5 cursor-pointer"
                onClick={(e) => toggleCustomerSelection(e, customer.id)}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => {}} // Handled by onClick on parent div
                />
              </div>

              <div className="cursor-pointer pl-5" onClick={() => handleViewCustomer(customer)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center w-4/5 mr-2 overflow-hidden">
                    <UserCircleIcon
                      className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="font-medium truncate">
                      {customer.firstName} {customer.lastName}
                    </h3>
                  </div>

                  {/* Invitation Status Badge */}
                  {invitationStatuses[customer.id] &&
                    invitationStatuses[customer.id].hasInvitations && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0
                      ${
                        invitationStatuses[customer.id].isUsed
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-green-100 text-green-800'
                      }`}
                      >
                        {invitationStatuses[customer.id].isUsed ? 'Invite Used' : 'Invite Active'}
                      </span>
                    )}
                </div>
                <div className="flex items-start space-x-2 mb-1">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-500 truncate w-5/6">{customer.email}</p>
                </div>
                <div className="flex items-start space-x-2 mb-1">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-500 truncate w-5/6">
                    {customer.phone ? (
                      customer.phone
                    ) : (
                      <span className="text-gray-400 italic">No phone number</span>
                    )}
                  </p>
                </div>
                <div className="flex items-start space-x-2 mb-1">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-500 truncate w-5/6">
                    {customer.company ? (
                      customer.company
                    ) : (
                      <span className="text-gray-400 italic">No company</span>
                    )}
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-500 truncate w-5/6">
                    Bookings: {customer.bookingsCount || 0}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Existing modals */}
      {/* Customer Creation Modal */}
      <CreateCustomerModal
        isOpen={workflowState === CustomerWorkflowState.CREATING}
        onClose={resetWorkflow}
        onComplete={handleCustomerComplete}
      />

      {/* Verification Link Modal - shown after customer creation */}
      <VerificationLinkPopupModal
        isOpen={workflowState === CustomerWorkflowState.SHOWING_INVITE}
        onClose={resetWorkflow}
        link={inviteLink}
        email={createdCustomerEmail}
      />

      {/* Only render these modals if a customer is selected */}
      {selectedCustomer && (
        <>
          {/* Customer Edit Modal */}
          <CreateCustomerModal
            isOpen={workflowState === CustomerWorkflowState.EDITING}
            onClose={resetWorkflow}
            onComplete={handleCustomerComplete}
            initialData={selectedCustomer}
            isEditing
          />

          {/* Document Attachment Modal */}
          <DocumentSearchModal
            isOpen={workflowState === CustomerWorkflowState.ATTACHING_DOCUMENT}
            onClose={resetWorkflow}
            onSelect={handleDocumentSelect}
            filter={(doc) => doc.category === 'passport_details'}
          />

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={workflowState === CustomerWorkflowState.CONFIRMING_DELETE}
            onClose={resetWorkflow}
          >
            <ModalHeader>
              <ModalTitle>Delete Customer</ModalTitle>
            </ModalHeader>
            <ModalContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <ExclamationTriangleIcon className="h-8 w-8" />
                  <div>
                    <h3 className="font-medium">Are you sure you want to delete this customer?</h3>
                    <p className="text-gray-500 text-sm">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-md">
                  <p className="font-medium">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="secondary" onClick={resetWorkflow} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCustomer}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Customer'}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)}>
        <ModalHeader>
          <ModalTitle>Delete Multiple Customers</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ExclamationTriangleIcon className="h-8 w-8" />
              <div>
                <h3 className="font-medium">
                  Are you sure you want to delete {selectedCustomers.size} customers?
                </h3>
                <p className="text-gray-500 text-sm">
                  This action cannot be undone and will permanently delete the selected customers.
                </p>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
              {filteredCustomers
                .filter((c) => selectedCustomers.has(c.id))
                .map((customer) => (
                  <div key={customer.id} className="py-1">
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected Customers'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
