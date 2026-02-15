import React, {
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Booking, Customer, BookingStatus, ActivityEvent } from "@/types/crm";
import {
  getBookings,
  checkInBooking as apiCheckIn,
  collectBooking as apiCollect,
  addBookingNote as apiAddNote,
  updateBookingStatus as apiUpdateStatus,
  updateBooking as apiUpdateBooking,
  UpdateBookingParams,
} from "@/lib/api/bookings";
import { CRMContext } from "./CRMContext";
import { useAuth } from "./AuthContext";

export const CRMProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings on mount and when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setBookings([]);
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const fetchedBookings = await getBookings();
        setBookings(fetchedBookings);

        // Extract unique customers from bookings
        const customerMap = new Map<string, Customer>();
        fetchedBookings.forEach((booking) => {
          if (!customerMap.has(booking.customerId)) {
            const customerBookings = fetchedBookings.filter(
              (b) => b.customerId === booking.customerId
            );
            const totalSpend = customerBookings
              .filter((b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW")
              .reduce((sum, b) => sum + b.cost, 0);
            const lastVisit = customerBookings[0]?.timestamp;

            customerMap.set(booking.customerId, {
              id: booking.customerId,
              fullName: booking.fullName,
              email: booking.email,
              whatsapp: booking.whatsapp,
              totalSpend,
              bookingCount: customerBookings.length,
              lastVisit,
              createdAt: booking.timestamp,
              isRepeat: customerBookings.length > 1,
            });
          }
        });
        setCustomers(Array.from(customerMap.values()));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bookings"
        );
        console.error("Error fetching bookings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);

  const updateBookingStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      try {
        const updatedBooking = await apiUpdateStatus(bookingId, status);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId ? updatedBooking : booking
          )
        );
      } catch (err) {
        console.error("Error updating booking status:", err);
        throw err;
      }
    },
    []
  );

  const checkInBooking = useCallback(async (bookingId: string) => {
    try {
      const updatedBooking = await apiCheckIn(bookingId);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
    } catch (err) {
      console.error("Error checking in booking:", err);
      throw err;
    }
  }, []);

  const collectBooking = useCallback(async (bookingId: string) => {
    try {
      const updatedBooking = await apiCollect(bookingId);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
    } catch (err) {
      console.error("Error collecting booking:", err);
      throw err;
    }
  }, []);

  const addBookingNote = useCallback(
    async (bookingId: string, note: string) => {
      try {
        const updatedBooking = await apiAddNote(bookingId, note);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId ? updatedBooking : booking
          )
        );
      } catch (err) {
        console.error("Error adding note:", err);
        throw err;
      }
    },
    []
  );

  const updateBooking = useCallback(
    async (bookingId: string, data: UpdateBookingParams): Promise<Booking> => {
      try {
        const updatedBooking = await apiUpdateBooking(bookingId, data);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId ? updatedBooking : booking
          )
        );
        return updatedBooking;
      } catch (err) {
        console.error("Error updating booking:", err);
        throw err;
      }
    },
    []
  );

  const getBookingById = useCallback(
    (bookingId: string) => {
      return bookings.find((b) => b.id === bookingId);
    },
    [bookings]
  );

  const getCustomerById = useCallback(
    (customerId: string) => {
      return customers.find((c) => c.id === customerId);
    },
    [customers]
  );

  const getBookingsByCustomer = useCallback(
    (customerId: string) => {
      return bookings.filter((b) => b.customerId === customerId);
    },
    [bookings]
  );

  const searchBookings = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return bookings.filter(
        (b) =>
          b.fullName.toLowerCase().includes(lowerQuery) ||
          b.registration.toLowerCase().includes(lowerQuery) ||
          b.whatsapp.includes(query) ||
          b.email.toLowerCase().includes(lowerQuery)
      );
    },
    [bookings]
  );

  return (
    <CRMContext.Provider
      value={{
        bookings,
        customers,
        updateBookingStatus,
        checkInBooking,
        collectBooking,
        addBookingNote,
        updateBooking,
        getBookingById,
        getCustomerById,
        getBookingsByCustomer,
        searchBookings,
        isLoading,
        error,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

