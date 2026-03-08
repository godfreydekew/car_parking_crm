import React, { useCallback, useMemo, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Booking, Customer, BookingStatus } from "@/types/crm";
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

const BOOKINGS_QUERY_KEY = ["bookings"] as const;

export const CRMProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: bookings = [],
    isLoading,
    error: queryError,
  } = useQuery<Booking[]>({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: () => getBookings(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const customers = useMemo(() => {
    if (!bookings.length) return [];
    const customerMap = new Map<string, Customer>();
    for (const booking of bookings) {
      if (!customerMap.has(booking.customerId)) {
        const customerBookings = bookings.filter(
          (b) => b.customerId === booking.customerId,
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
    }
    return Array.from(customerMap.values());
  }, [bookings]);

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load bookings"
    : null;

  const setBookingsInCache = useCallback(
    (updater: (prev: Booking[]) => Booking[]) => {
      queryClient.setQueryData<Booking[]>(BOOKINGS_QUERY_KEY, (prev = []) =>
        updater(prev),
      );
    },
    [queryClient],
  );

  const updateBookingStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      try {
        const updatedBooking = await apiUpdateStatus(bookingId, status);
        setBookingsInCache((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
      } catch (err) {
        console.error("Error updating booking status:", err);
        throw err;
      }
    },
    [setBookingsInCache],
  );

  const checkInBooking = useCallback(
    async (bookingId: string) => {
      try {
        const updatedBooking = await apiCheckIn(bookingId);
        setBookingsInCache((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
      } catch (err) {
        console.error("Error checking in booking:", err);
        throw err;
      }
    },
    [setBookingsInCache],
  );

  const collectBooking = useCallback(
    async (bookingId: string) => {
      try {
        const updatedBooking = await apiCollect(bookingId);
        setBookingsInCache((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
      } catch (err) {
        console.error("Error collecting booking:", err);
        throw err;
      }
    },
    [setBookingsInCache],
  );

  const addBookingNote = useCallback(
    async (bookingId: string, note: string) => {
      try {
        const updatedBooking = await apiAddNote(bookingId, note);
        setBookingsInCache((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
      } catch (err) {
        console.error("Error adding note:", err);
        throw err;
      }
    },
    [setBookingsInCache],
  );

  const updateBooking = useCallback(
    async (bookingId: string, data: UpdateBookingParams): Promise<Booking> => {
      try {
        const updatedBooking = await apiUpdateBooking(bookingId, data);
        setBookingsInCache((prev) =>
          prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
        );
        return updatedBooking;
      } catch (err) {
        console.error("Error updating booking:", err);
        throw err;
      }
    },
    [setBookingsInCache],
  );

  const getBookingById = useCallback(
    (bookingId: string) => {
      return bookings.find((b) => b.id === bookingId);
    },
    [bookings],
  );

  const getCustomerById = useCallback(
    (customerId: string) => {
      return customers.find((c) => c.id === customerId);
    },
    [customers],
  );

  const getBookingsByCustomer = useCallback(
    (customerId: string) => {
      return bookings.filter((b) => b.customerId === customerId);
    },
    [bookings],
  );

  const searchBookings = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return bookings.filter(
        (b) =>
          b.fullName.toLowerCase().includes(lowerQuery) ||
          b.registration.toLowerCase().includes(lowerQuery) ||
          b.whatsapp.includes(query) ||
          b.email.toLowerCase().includes(lowerQuery),
      );
    },
    [bookings],
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
