import { Booking, Customer, BookingStatus, FlightType, PaymentMethod, ActivityEvent } from '@/types/crm';

const generateId = () => Math.random().toString(36).substring(2, 11);

const vehicleMakes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Volkswagen', 'Audi', 'Mazda', 'Nissan', 'Hyundai'];
const vehicleModels: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Fortuner'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Jazz', 'HR-V'],
  Ford: ['Ranger', 'Focus', 'Fiesta', 'EcoSport', 'Everest'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5', '1 Series'],
  Mercedes: ['C-Class', 'E-Class', 'GLC', 'A-Class', 'GLA'],
  Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Cross'],
  Audi: ['A3', 'A4', 'Q3', 'Q5', 'A6'],
  Mazda: ['CX-5', 'Mazda3', 'CX-30', 'Mazda6', 'CX-9'],
  Nissan: ['Qashqai', 'X-Trail', 'Navara', 'Micra', 'Juke'],
  Hyundai: ['Tucson', 'i30', 'Kona', 'Santa Fe', 'i20'],
};
const colors = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Brown'];
const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'John', 'Anna', 'Robert', 'Maria', 'William', 'Jennifer', 'Thomas', 'Nicole', 'Peter', 'Rachel', 'Andrew', 'Kate', 'Mark', 'Sophie'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker'];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRegistration = (): string => {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const formats = [
    () => `${randomElement(letters.split(''))}${randomElement(letters.split(''))}${randomInt(10, 99)} ${randomElement(letters.split(''))}${randomElement(letters.split(''))}${randomElement(letters.split(''))}`,
    () => `CA ${randomInt(100, 999)}-${randomInt(100, 999)}`,
    () => `${randomElement(letters.split(''))}${randomElement(letters.split(''))} ${randomInt(10, 99)} ${randomElement(letters.split(''))}${randomElement(letters.split(''))}`,
  ];
  return randomElement(formats)();
};

const generatePhone = (): string => {
  return `+27${randomInt(60, 89)}${randomInt(100, 999)}${randomInt(1000, 9999)}`;
};

export const generateCustomers = (count: number): Customer[] => {
  const customers: Customer[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const bookingCount = randomInt(1, 8);
    
    customers.push({
      id: generateId(),
      fullName,
      email: i % 10 === 7 ? '' : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'])}`,
      whatsapp: generatePhone(),
      totalSpend: randomInt(200, 3000),
      bookingCount,
      lastVisit: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000),
      isRepeat: bookingCount > 1,
    });
  }
  
  return customers;
};

export const generateBookings = (customers: Customer[], count: number): Booking[] => {
  const bookings: Booking[] = [];
  const now = new Date();
  
  const statuses: BookingStatus[] = ['BOOKED', 'ON_SITE', 'COLLECTED', 'OVERSTAY', 'CANCELLED', 'NO_SHOW'];
  const statusWeights = [15, 12, 40, 5, 3, 5]; // Weighted distribution
  
  const getWeightedStatus = (): BookingStatus => {
    const total = statusWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < statuses.length; i++) {
      random -= statusWeights[i];
      if (random <= 0) return statuses[i];
    }
    return 'BOOKED';
  };
  
  for (let i = 0; i < count; i++) {
    const customer = randomElement(customers);
    const make = randomElement(vehicleMakes);
    const model = randomElement(vehicleModels[make]);
    const status = getWeightedStatus();
    
    const daysOffset = randomInt(-7, 14);
    const departureDate = new Date(now);
    departureDate.setDate(departureDate.getDate() + daysOffset);
    
    const tripDuration = randomInt(2, 14);
    const arrivalDate = new Date(departureDate);
    arrivalDate.setDate(arrivalDate.getDate() + tripDuration);
    
    const cost = randomInt(150, 800);
    const flightType: FlightType = Math.random() > 0.4 ? 'DOMESTIC' : 'INTERNATIONAL';
    const paymentMethods: PaymentMethod[] = ['CASH', 'EFT', 'CARD', 'PENDING'];
    const paymentMethod = randomElement(paymentMethods);
    
    const createdAt = new Date(departureDate);
    createdAt.setDate(createdAt.getDate() - randomInt(1, 14));
    
    const activity: ActivityEvent[] = [
      {
        id: generateId(),
        type: 'created',
        description: 'Booking created',
        timestamp: createdAt,
        user: 'System',
      },
    ];
    
    let checkInTime: Date | undefined;
    let collectedTime: Date | undefined;
    
    if (status === 'ON_SITE' || status === 'COLLECTED' || status === 'OVERSTAY') {
      checkInTime = new Date(departureDate);
      checkInTime.setHours(randomInt(4, 12), randomInt(0, 59));
      activity.push({
        id: generateId(),
        type: 'check_in',
        description: 'Vehicle checked in',
        timestamp: checkInTime,
        user: randomElement(['Admin', 'Manager', 'Staff']),
      });
    }
    
    if (status === 'COLLECTED') {
      collectedTime = new Date(arrivalDate);
      collectedTime.setHours(randomInt(14, 23), randomInt(0, 59));
      activity.push({
        id: generateId(),
        type: 'collected',
        description: 'Vehicle collected by customer',
        timestamp: collectedTime,
        user: randomElement(['Admin', 'Manager', 'Staff']),
      });
    }
    
    if (status === 'OVERSTAY') {
      activity.push({
        id: generateId(),
        type: 'overstay_marked',
        description: 'Booking marked as overstay - customer has not collected vehicle',
        timestamp: new Date(arrivalDate.getTime() + 3 * 60 * 60 * 1000),
        user: 'System',
      });
    }
    
    const specialInstructions = Math.random() > 0.7 
      ? randomElement([
          'Please park in covered area',
          'Keys in glovebox',
          'Call before pickup',
          'VIP customer - priority service',
          'Needs car wash before pickup',
          'Fragile items in boot',
          '',
        ])
      : '';
    
    bookings.push({
      id: generateId(),
      customerId: customer.id,
      timestamp: createdAt,
      fullName: customer.fullName,
      email: customer.email,
      whatsapp: customer.whatsapp,
      flightType,
      departureDate,
      departureTime: `${String(randomInt(4, 22)).padStart(2, '0')}:${randomElement(['00', '15', '30', '45'])}`,
      arrivalDate,
      arrivalTime: `${String(randomInt(6, 23)).padStart(2, '0')}:${randomElement(['00', '15', '30', '45'])}`,
      vehicleMake: make,
      vehicleModel: model,
      vehicleColor: randomElement(colors),
      registration: generateRegistration(),
      paymentMethod,
      specialInstructions,
      cost,
      status,
      checkInTime,
      collectedTime,
      activity,
      notes: Math.random() > 0.8 ? [randomElement(['Customer called to confirm', 'Requested early pickup', 'Paid extra for premium spot'])] : [],
    });
  }
  
  return bookings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate initial data
export const initialCustomers = generateCustomers(30);
export const initialBookings = generateBookings(initialCustomers, 45);
