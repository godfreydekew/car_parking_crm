/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://airportparkingcrm-qsgjh.ondigitalocean.app';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const authConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}