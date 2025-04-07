import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookingWithDetails } from '@/contexts/types'
import { BookingDocument as BookingDocumentType, Document, BookingDocument } from '@/types/document'
import { useAdminBooking } from '@/contexts/booking/AdminBookingContext'
import { useDocument } from '@/contexts/document/DocumentContext'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/shared'
import { DocumentManager } from '@/components/booking/DocumentManager'
import { format } from 'date-fns'
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DocumentIcon,
  ArrowLeftIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

function BookingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function BookingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBookingById, updateBooking, isLoading } = useAdminBooking()
  const {
    addBookingDocument: contextAddBookingDocument,
    updateBookingDocument: contextUpdateBookingDocument,
    deleteBookingDocument: contextDeleteBookingDocument,
  } = useDocument()
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [creatorInfo, setCreatorInfo] = useState<string>('Administrator')

  useEffect(() => {
    if (!id) {
      setError('Booking ID is required')
      return
    }

    const fetchBooking = async () => {
      try {
        setError(null);
        console.log(`Attempting to fetch booking with ID: ${id}`);
        const bookingData = await getBookingById(id);
        
        if (!bookingData) {
          console.error(`Booking with ID ${id} not found`);
          setError('Booking not found. It may have been deleted or you do not have permission to view it.');
          return;
        }
        
        console.log(`Successfully fetched booking with ID: ${bookingData.id} (type: ${typeof bookingData.id})`);
        
        // Verify ID match
        const idMatch = String(bookingData.id) === String(id);
        console.log(`ID match check: ${idMatch}, Expected: ${id}, Got: ${bookingData.id}`);
        
        if (!idMatch) {
          console.warn(`Warning: Fetched booking ID (${bookingData.id}) does not match requested ID (${id})`);
        }
        
        // Add detailed logging of booking structure
        console.log('Raw booking data structure:', JSON.stringify(bookingData, null, 2));
        
        // Extract admin creator info if available
        // Use type assertion to access potential properties safely
        const rawData = bookingData as any;
        let adminInfo = 'Administrator';
        
        // Try all possible fields that might contain admin information
        if (rawData?.created_by_admin) {
          adminInfo = rawData.created_by_admin;
        } else if (rawData?.admin?.name) {
          adminInfo = rawData.admin.name;
        } else if (rawData?.admin?.firstName && rawData?.admin?.lastName) {
          adminInfo = `${rawData.admin.firstName} ${rawData.admin.lastName}`;
        } else if (rawData?.created_by_admin_name) {
          adminInfo = rawData.created_by_admin_name;
        } else if (rawData?.adminName) {
          adminInfo = rawData.adminName;
        } else if (rawData?.admin_name) {
          adminInfo = rawData.admin_name;
        } else if (rawData?.created_by) {
          adminInfo = rawData.created_by;
        } else if (rawData?.adminId || rawData?.admin_id || rawData?.created_by_admin_id) {
          const id = rawData?.adminId || rawData?.admin_id || rawData?.created_by_admin_id;
          adminInfo = `Admin #${id}`;
        }
        
        setCreatorInfo(adminInfo);
        
        // Extract creation date
        let creationDate = null;
        if (rawData?.created_at) {
          creationDate = new Date(rawData.created_at);
        } else if (rawData?.createdAt) {
          creationDate = new Date(rawData.createdAt);
        }
        
        // Transform data to ensure all expected properties exist
        const transformedBooking: BookingWithDetails = {
          ...bookingData, // Keep all existing fields
          
          // IMPORTANT: Preserve the original ID to ensure it matches the URL parameter
          id: bookingData.id,
          yachtId: bookingData.yachtId || bookingData.yacht?.id || '',
          customerId: bookingData.customerId || bookingData.mainCharterer?.id || '',
          startDate: bookingData.startDate || '',
          endDate: bookingData.endDate || '',
          status: bookingData.status || 'pending',
          totalPrice: bookingData.totalPrice || 0,
          specialRequests: bookingData.specialRequests || '',
          
          // Ensure creation date is preserved (use type assertion to access it)
          // TypeScript will ignore these properties in the type system but they'll be available at runtime
          ...(rawData.created_at ? { created_at: rawData.created_at } : {}),
          ...(rawData.createdAt ? { createdAt: rawData.createdAt } : {}),
          
          // Ensure yacht has all required properties
          yacht: {
            ...(bookingData.yacht || {}),
            id: bookingData.yacht?.id || '',
            name: bookingData.yacht?.name || 'Unknown Yacht',
            specifications: {
              ...(bookingData.yacht?.specifications || {}),
              length: bookingData.yacht?.specifications?.length || 'Unknown',
              capacity: bookingData.yacht?.specifications?.capacity || 0,
              crew: bookingData.yacht?.specifications?.crew || 0
            }
          },
          
          // Ensure destination exists
          destination: bookingData.destination || {
            id: '',
            name: 'Unknown Destination',
            isFromApi: false
          },
          
          // Ensure customer exists
          customer: bookingData.customer || {
            id: bookingData.mainCharterer?.id || '',
            name: `${bookingData.mainCharterer?.firstName || ''} ${bookingData.mainCharterer?.lastName || ''}`.trim() || 'Unknown Customer',
            email: bookingData.mainCharterer?.email || ''
          },
          
          // Ensure mainCharterer has required properties
          mainCharterer: {
            ...(bookingData.mainCharterer || {}),
            id: bookingData.mainCharterer?.id || '',
            firstName: bookingData.mainCharterer?.firstName || 'Unknown',
            lastName: bookingData.mainCharterer?.lastName || '',
            email: bookingData.mainCharterer?.email || 'No Email'
          },
          
          // Ensure required collections exist
          guestList: bookingData.guestList || [],
          documents: bookingData.documents || [],
          guests: bookingData.guests || 0 // This can be a number
        };
        
        console.log(`Transformed booking ID: ${transformedBooking.id} (type: ${typeof transformedBooking.id})`);
        console.log('Transformed booking data:', JSON.stringify(transformedBooking, null, 2));
        
        // Set booking in component state
        setBooking(transformedBooking);
      } catch (err) {
        console.error(`Error loading booking with ID ${id}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load booking. Please try again later.');
      }
    };

    fetchBooking();
  }, [id, getBookingById]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleBack = () => {
    navigate('/admin/bookings')
  }

  const handleEdit = () => {
    if (booking) {
      // Store the booking ID in session storage and navigate to bookings page
      // The bookings page will detect this ID and open the edit form
      navigate('/admin/bookings')
      sessionStorage.setItem('editBookingId', booking.id)
    }
  }

  // Convert from DocumentContext BookingDocument to our component BookingDocument
  const adaptToComponentDocument = (doc: any): BookingDocumentType => {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      type: 'file',
      category: doc.type || 'other',
      url: doc.url,
      uploadedAt: doc.uploadedAt,
      visibleToAllGuests: doc.visibility === 'all',
      metadata: doc.metadata || {},
    }
  }

  // Convert from component BookingDocument to DocumentContext BookingDocument
  const adaptToContextDocument = (doc: Omit<BookingDocumentType, 'id' | 'uploadedAt'> & { file?: File }) => {
    return {
      title: doc.title,
      description: doc.description,
      type: doc.category,
      documentType: 'file',
      visibility: doc.visibleToAllGuests ? 'all' : 'main_charterer',
      url: doc.url || '',
      metadata: doc.metadata
    }
  }

  const handleAddDocument = async (document: Omit<BookingDocumentType, 'id' | 'uploadedAt'> & { file?: File }) => {
    if (!booking) return

    try {
      // Check if this is an existing document from search
      const isExistingDocument = document.metadata?.isExistingDocument;
      const originalDocumentId = document.metadata?.originalDocumentId;
      
      // Create a properly typed BookingDocument for the context
      const contextDocument: Omit<BookingDocument, 'id' | 'uploadedAt'> = {
        title: document.title,
        description: document.description,
        category: document.category || 'other',
        type: 'file',
        visibleToAllGuests: document.visibleToAllGuests || false,
        metadata: document.metadata || {},
        url: document.url || '',
      };
      
      let newDocument;
      
      if (isExistingDocument && originalDocumentId) {
        // For existing documents, we use a different approach
        console.log('Adding existing document reference:', originalDocumentId);
        
        // Add document to booking through the context
        newDocument = await contextAddBookingDocument(booking.id, contextDocument);
      } else {
        // For new uploads, we need the file
        const file = document.file;
        
        if (!file) {
          setError('Please select a file to upload');
          return;
        }
        
        // Add new document with file
        newDocument = await contextAddBookingDocument(booking.id, contextDocument, file);
      }
      
      // Convert to our expected format
      const componentDocument = adaptToComponentDocument(newDocument);
      
      // Update booking with new document
      const updatedBooking = {
        ...booking,
        documents: [...booking.documents, componentDocument]
      } as BookingWithDetails;
      
      // Update booking in context and local state
      await updateBooking(booking.id, updatedBooking);
      setBooking(updatedBooking);
    } catch (err) {
      console.error('Error adding document:', err);
      setError(err instanceof Error ? err.message : 'Failed to add document');
    }
  }

  const handleUpdateDocument = async (documentId: string, updates: Partial<BookingDocumentType>) => {
    if (!booking) return

    try {
      const contextUpdates: Record<string, any> = {};

      // Convert visibleToAllGuests to visibility for context
      if ('visibleToAllGuests' in updates) {
        contextUpdates.visibility = updates.visibleToAllGuests ? 'all' : 'main_charterer';
      }

      // Map other properties
      if (updates.title) contextUpdates.title = updates.title;
      if (updates.description) contextUpdates.description = updates.description;
      if (updates.category) contextUpdates.type = updates.category;
      if (updates.metadata) contextUpdates.metadata = updates.metadata;

      // Update through context
      await contextUpdateBookingDocument(booking.id, documentId, contextUpdates);

      // Apply updates to local booking state
      const updatedBooking = {
        ...booking,
        documents: booking.documents.map(doc => {
          if (doc.id === documentId) {
            return {
              ...doc,
              ...contextUpdates,
              // Handle special case for visibility
              visibility: 'visibleToAllGuests' in updates
                ? (updates.visibleToAllGuests ? 'all' : 'main_charterer')
                : doc.visibility
            };
          }
          return doc;
        })
      } as BookingWithDetails;

      await updateBooking(booking.id, updatedBooking);
      setBooking(updatedBooking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!booking) return

    try {
      // Delete the document via document context
      await contextDeleteBookingDocument(booking.id, documentId)

      // Update the booking state
      const updatedBooking = {
        ...booking,
        documents: booking.documents.filter((doc) => doc.id !== documentId),
      }

      await updateBooking(booking.id, updatedBooking)
      setBooking(updatedBooking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Booking Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={handleBack}>
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Bookings
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!booking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBack}>
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Bookings
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 p-4 rounded-md text-xs">
          <details>
            <summary className="font-medium">Debug: Booking ID Information</summary>
            <div className="mt-2">
              <p><strong>URL Parameter ID:</strong> {id}</p>
              <p><strong>Booking ID in State:</strong> {booking?.id} (type: {typeof booking?.id})</p>
              <p><strong>ID Match:</strong> {String(booking?.id) === String(id) ? 'Yes ✅' : 'No ❌'}</p>
              <hr className="my-2" />
              <p><strong>Admin Creator Info:</strong></p>
              <p>Display Name: {creatorInfo}</p>
              <p>Raw Admin Object: {(booking as any)?.admin ? JSON.stringify((booking as any).admin) : 'Not available'}</p>
              <p>Created By Admin ID: {(booking as any)?.created_by_admin_id || 'Not set'}</p>
              <p>Created By Admin: {(booking as any)?.created_by_admin || 'Not set'}</p>
            </div>
          </details>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Button onClick={handleBack} variant="secondary">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Bookings
        </Button>
        <Button onClick={handleEdit} variant="primary">
          <PencilIcon className="h-5 w-5 mr-2" />
          Edit Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Yacht Information</h3>
              <dl className="space-y-2">
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-lg">{booking?.yacht?.name || 'N/A'}</dd>
                <dt className="text-sm text-gray-500 mt-2">Specifications</dt>
                <dd>
                  <ul className="list-disc list-inside text-sm">
                    <li>Length: {booking?.yacht?.specifications?.length || 'N/A'}</li>
                    <li>Capacity: {booking?.yacht?.specifications?.capacity || 'N/A'} guests</li>
                    <li>Crew: {booking?.yacht?.specifications?.crew || 'N/A'} members</li>
                  </ul>
                </dd>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Booking Details</h3>
              <dl className="space-y-2">
                <dt className="text-sm text-gray-500">Dates</dt>
                <dd>
                  {formatDate(booking?.startDate)} - {formatDate(booking?.endDate)}
                </dd>
                <dt className="text-sm text-gray-500 mt-2">Status</dt>
                <dd className="capitalize">{booking?.status || 'N/A'}</dd>
                <dt className="text-sm text-gray-500 mt-2">Total Price</dt>
                <dd>${booking?.totalPrice ? booking.totalPrice.toLocaleString() : 'N/A'}</dd>
              </dl>
            </div>
          </div>

          {/* Main Charterer */}
          <div>
            <h3 className="text-lg font-medium mb-4">Main Charterer</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium">
                {booking?.mainCharterer?.firstName || 'N/A'} {booking?.mainCharterer?.lastName || ''}
              </div>
              <div className="text-sm text-gray-600">{booking?.mainCharterer?.email || 'N/A'}</div>
            </div>
          </div>

          {/* Guest List */}
          <div>
            <h3 className="text-lg font-medium mb-4">Guest List</h3>
            <div className="space-y-2">
              {!booking?.guestList || booking.guestList.length === 0 ? (
                <p className="text-gray-500">No guests added</p>
              ) : (
                booking.guestList.map((guest) => (
                  <div key={guest.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{guest.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Special Requests (replacing Documents) */}
          <div>
            <h3 className="text-lg font-medium mb-4">Special Requests</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {booking?.specialRequests ? (
                <p>{booking.specialRequests}</p>
              ) : (
                <p className="text-gray-500">No special requests</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section - Keep but move below */}
      {booking && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentManager
              documents={booking.documents?.map(doc => ({
                ...doc,
                // Convert context document format to component format
                visibleToAllGuests: doc.visibility === 'all',
                category: doc.type || 'other',
                type: 'file'
              })) || []}
              onAddDocument={handleAddDocument as any}
              onUpdateDocument={handleUpdateDocument as any}
              onDeleteDocument={handleDeleteDocument}
            />
          </CardContent>
        </Card>
      )}

      {/* Booking Metadata Section */}
      {booking && (
        <Card className="p-6 bg-gray-50 border-t border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Booking Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="text-gray-400">Booking ID</p>
              <p className="mt-1 font-mono">{booking.id}</p>
            </div>
            <div>
              <p className="text-gray-400">Created</p>
              <p className="mt-1">
                {(booking as any).created_at 
                  ? new Date((booking as any).created_at).toLocaleDateString() 
                  : ((booking as any).createdAt 
                    ? new Date((booking as any).createdAt).toLocaleDateString() 
                    : 'Unknown')}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Created by</p>
              <p className="mt-1">
                {creatorInfo}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
