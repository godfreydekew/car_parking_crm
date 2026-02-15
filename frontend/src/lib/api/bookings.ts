/**
 * Bookings API functions
 */
import { apiGet, apiPatch, apiPost } from './client';
import { Booking } from '@/types/crm';

export interface GetBookingsParams {
  status?: string;
  payment_method?: string;
  flight_type?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

/**
 * GET /api/bookings
 * Get all bookings with optional filters
 */
export async function getBookings(params?: GetBookingsParams): Promise<Booking[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.status) queryParams.append('status', params.status);
  if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
  if (params?.flight_type) queryParams.append('flight_type', params.flight_type);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.skip) queryParams.append('skip', params.skip.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString();
  const endpoint = `/api/bookings${queryString ? `?${queryString}` : ''}`;
  
  const bookings = await apiGet<Booking[]>(endpoint);
  
  // Convert date strings to Date objects
  return bookings.map(booking => ({
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  }));
}

/**
 * GET /api/bookings/{booking_id}
 * Get a single booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking> {
  const booking = await apiGet<Booking>(`/api/bookings/${bookingId}`);
  
  // Convert date strings to Date objects
  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

/**
 * PATCH /api/bookings/{booking_id}/check-in
 * Mark a booking as checked in (ON_SITE)
 */
export async function checkInBooking(bookingId: string): Promise<Booking> {
  const booking = await apiPatch<Booking>(`/api/bookings/${bookingId}/check-in`);
  
  // Convert date strings to Date objects
  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

/**
 * PATCH /api/bookings/{booking_id}/collect
 * Mark a booking as collected (COLLECTED)
 */
export async function collectBooking(bookingId: string): Promise<Booking> {
  const booking = await apiPatch<Booking>(`/api/bookings/${bookingId}/collect`);
  
  // Convert date strings to Date objects
  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

/**
 * PATCH /api/bookings/{booking_id}/status
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: string
): Promise<Booking> {
  const booking = await apiPatch<Booking>(
    `/api/bookings/${bookingId}/status?status=${status.toLowerCase()}`
  );
  
  // Convert date strings to Date objects
  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

/**
 * POST /api/bookings/{booking_id}/update
 * Update editable booking fields
 */
export interface UpdateBookingParams {
  pickup_at?: string;
  payment_method?: string;
  special_instructions?: string;
  cost?: number;
  status?: string;
}

export async function updateBooking(
  bookingId: string,
  data: UpdateBookingParams
): Promise<Booking> {
  const booking = await apiPost<Booking>(
    `/api/bookings/${bookingId}/update`,
    data
  );

  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

/**
 * POST /api/bookings/{booking_id}/notes
 * Add a note to a booking
 */
export async function addBookingNote(
  bookingId: string,
  note: string
): Promise<Booking> {
  const booking = await apiPost<Booking>(
    `/api/bookings/${bookingId}/notes`,
    { note }
  );
  
  // Convert date strings to Date objects
  return {
    ...booking,
    timestamp: new Date(booking.timestamp),
    departureDate: new Date(booking.departureDate),
    arrivalDate: new Date(booking.arrivalDate),
    checkInTime: booking.checkInTime ? new Date(booking.checkInTime) : undefined,
    collectedTime: booking.collectedTime ? new Date(booking.collectedTime) : undefined,
    activity: booking.activity.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
  };
}

