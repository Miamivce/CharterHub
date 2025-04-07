import { useState, useEffect, useRef } from 'react'
import { ClientUser } from '@/contexts/types'
import { customerService } from '@/services/customerService'
import { Input, Button, Dropdown, DropdownItem } from '@/components/shared'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { CreateCustomerModal, CustomerModalResult } from './CreateCustomerModal'

export interface CustomerSearchProps {
  onSelect: (customer: ClientUser) => void
  autoFocus?: boolean
  placeholder?: string
  buttonText?: string
  selectedCustomer?: ClientUser | null
}

export function CustomerSearch({
  onSelect,
  autoFocus = false,
  placeholder = 'Search customers...',
  buttonText = 'New Customer',
  selectedCustomer,
}: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<ClientUser[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<ClientUser[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [justCreatedCustomerId, setJustCreatedCustomerId] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
  }, [])

  // Effect to handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter customers when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCustomers([])
      return
    }

    const filtered = customers
      .filter((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
        const email = customer.email?.toLowerCase() || ''
        const term = searchTerm.toLowerCase()

        return fullName.includes(term) || email.includes(term)
      })
      .slice(0, 5) // Limit to 5 results

    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  // Load customers from service
  const loadCustomers = async () => {
    console.log('CustomerSearch: Loading customers')
    setIsLoading(true)
    try {
      const allCustomers = await customerService.getCustomers()
      console.log(`CustomerSearch: Loaded ${allCustomers.length} customers`)
      const typedCustomers: ClientUser[] = allCustomers.map((customer) => ({
        ...customer,
        role: 'client',
      }))
      setCustomers(typedCustomers)

      // If we just created a customer, find it in the loaded data
      if (justCreatedCustomerId) {
        const createdCustomer = typedCustomers.find(
          (c) => c.id.toString() === justCreatedCustomerId
        )
        if (createdCustomer) {
          console.log(
            `CustomerSearch: Found just created customer: ${createdCustomer.firstName} ${createdCustomer.lastName}`
          )
          setJustCreatedCustomerId(null)
        }
      }
    } catch (err) {
      console.error('Error loading customers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsDropdownOpen(true)
  }

  const handleSearchFocus = () => {
    if (searchTerm) {
      setIsDropdownOpen(true)
    }
  }

  const handleCustomerSelect = (customer: ClientUser) => {
    console.log(
      `CustomerSearch: Selected customer: ${customer.firstName} ${customer.lastName} (${customer.id})`
    )
    setSearchTerm(`${customer.firstName} ${customer.lastName}`)
    setIsDropdownOpen(false)
    onSelect(customer)
  }

  const handleCreateCustomer = (newCustomer: ClientUser) => {
    console.log(
      `CustomerSearch: Customer created: ${newCustomer.firstName} ${newCustomer.lastName} (${newCustomer.id})`
    )
    console.log(`CustomerSearch: Customer notes: "${newCustomer.notes || 'None'}"`) // Log notes for debugging
    setIsCreatingCustomer(true)

    // Store the ID of the just created customer so we can find it after reloading
    setJustCreatedCustomerId(newCustomer.id.toString())

    // Ensure notes are properly synced
    if (newCustomer.notes) {
      customerService
        .ensureCustomerNotesSynced(newCustomer.id.toString(), newCustomer.notes)
        .then((success) => {
          console.log(
            `CustomerSearch: Notes sync ${success ? 'successful' : 'failed'} for ${newCustomer.id}`
          )
        })
        .catch((err) => {
          console.error('Error ensuring notes are synced:', err)
        })
    } else {
      // Just clear the cache if no notes
      customerService.clearCustomerCache(newCustomer.id.toString())
    }

    // Dispatch the customer created event to notify other components
    try {
      // Create a custom event for the new customer
      const event = new CustomEvent('customer:created', {
        detail: {
          customer: newCustomer,
          eventId: `notes_update_${Date.now()}`,
        },
      })
      // Dispatch the event
      window.dispatchEvent(event)
      console.log(`CustomerSearch: Dispatched customer:created event for ${newCustomer.id}`)
    } catch (eventErr) {
      console.error('Error dispatching customer event:', eventErr)
    }

    // Reload customers to ensure we have the latest data
    setTimeout(async () => {
      try {
        console.log('CustomerSearch: Reloading customers after new customer creation')
        await loadCustomers()

        // Delay the selection to ensure all data is properly updated
        setTimeout(() => {
          // The modal will be closed by the user explicitly after creation
          console.log(
            `CustomerSearch: Selecting newly created customer: ${newCustomer.firstName} ${newCustomer.lastName}`
          )
          handleCustomerSelect(newCustomer)
          setIsCreatingCustomer(false)
        }, 700)
      } catch (err) {
        console.error('Error reloading customers after creation:', err)
        setIsCreatingCustomer(false)
      }
    }, 500)
  }

  return (
    <div className="w-full">
      <div className="relative" ref={dropdownRef}>
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="pr-10"
              disabled={isCreatingCustomer}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Button onClick={() => setIsModalOpen(true)} size="sm" disabled={isCreatingCustomer}>
            <PlusIcon className="h-5 w-5 mr-1" />
            {buttonText}
          </Button>
        </div>

        {/* Results dropdown */}
        {isDropdownOpen && filteredCustomers.length > 0 && (
          <Dropdown className="w-full mt-1 max-h-60 overflow-auto">
            {filteredCustomers.map((customer) => (
              <DropdownItem key={customer.id} onClick={() => handleCustomerSelect(customer)}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </span>
                  {customer.email && (
                    <span className="text-sm text-gray-500">{customer.email}</span>
                  )}
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Create customer modal */}
      <CreateCustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('CustomerSearch: Closing create customer modal')
          setIsModalOpen(false)
        }}
        onComplete={(result: CustomerModalResult) => {
          console.log(
            `CustomerSearch: Customer ${result.action}: ${result.customer.firstName} ${result.customer.lastName}`
          )
          handleCreateCustomer(result.customer)
        }}
      />
    </div>
  )
}
