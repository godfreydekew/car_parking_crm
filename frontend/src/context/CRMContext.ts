import React, {createContext} from "react";
import { Booking, Customer, BookingStatus, ActivityEvent } from "@/types/crm";
  
interface CRMContextType {
    bookings: Booking[];
    customers: Customer[];
    updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
    checkInBooking: (bookingId: string) => Promise<void>;
    collectBooking: (bookingId: string) => Promise<void>;
    addBookingNote: (bookingId: string, note: string) => Promise<void>;
    getBookingById: (bookingId: string) => Booking | undefined;
    getCustomerById: (customerId: string) => Customer | undefined;
    getBookingsByCustomer: (customerId: string) => Booking[];
    searchBookings: (query: string) => Booking[];
    isLoading: boolean;
    error: string | null;
  }
  
export const CRMContext = createContext<CRMContextType | undefined>(undefined);