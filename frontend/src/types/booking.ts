import { Document } from './document'

export interface BookingDocument extends Document {
  visibility: 'main_charterer' | 'all'
}

export interface Booking {
  id: string | number
  mainCharterer: {
    id: string | number
    firstName: string
    lastName: string
    email: string
  }
  guestList: Array<{
    id: string | number
    firstName: string
    lastName: string
    email: string
  }>
  yacht: {
    id: string | number
    name: string
  }
  startDate: string
  endDate: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface CustomerBooking extends Booking {
  role: 'main_charterer' | 'guest'
}
