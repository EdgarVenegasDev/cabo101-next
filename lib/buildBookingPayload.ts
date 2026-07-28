// lib/buildBookingPayload.ts


type BookingInput = {
  transaction_amount: number;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  summary: string;

  pickupLocation: string;
  dropoffLocation: string;

  passengers: string | number;

  vehicleType: string;

  pickupDate: string;
  pickupTime: string;

  roundTrip: boolean;

  returnFlight: string;

  returnPickupLocation: string;
  returnDropoffLocation: string;
  returnPickupDate: string;
  returnPickupTime: string;

  airline?: string;
  flight?: string;
  arrival?: string;

  additionalService?: number;
  paidAmount?: number;

  // Parada tipo "grocery stop": minutos elegidos (15/30/60/90/120) y el
  // cargo correspondiente en USD (0/10/50/100/200). Se mandan aparte de
  // additionalService para que el correo y el admin puedan mostrar algo
  // claro como "Stop: 30 minutes (+$10 USD)" en vez de solo un monto
  // genérico de "servicio adicional".
  stopMinutes?: number;
  stopFeeUSD?: number;

  notes?: string;
};

export function buildBookingPayload(input: BookingInput) {
  return {
    // Datos de la reserva (raíz)
    transaction_amount: input.transaction_amount,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    pickupLocation: input.pickupLocation,
    dropoffLocation: input.dropoffLocation,
    passengers: input.passengers,
    vehicleType: input.vehicleType,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    roundTrip: input.roundTrip,
    returnPickupLocation: input.returnPickupLocation,
    returnDropoffLocation: input.returnDropoffLocation,
    returnPickupDate: input.returnPickupDate,
    returnPickupTime: input.returnPickupTime,
    airline: input.airline,
    flight: input.flight,
    arrival: input.arrival,

    additionalService: input.additionalService,
    paidAmount: input.paidAmount,

    stopMinutes: input.stopMinutes,
    stopFeeUSD: input.stopFeeUSD,

    notes: input.notes,

    payer: {
      name: input.firstName,
      email: input.email,
      phone: {
        number: input.phone,
      },
    },

    metadata: {
      booking: {
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        passengers: input.passengers,
        vehicleType: input.vehicleType,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
        roundTrip: input.roundTrip,
        returnPickupLocation: input.returnPickupLocation,
        returnDropoffLocation: input.returnDropoffLocation,
        returnPickupDate: input.returnPickupDate,
        returnPickupTime: input.returnPickupTime,
        airline: input.airline,
        flight: input.flight,
        arrival: input.arrival,
        returnFlight: input.returnFlight,
        additionalService: input.additionalService,
        paidAmount: input.paidAmount,
        stopMinutes: input.stopMinutes,
        stopFeeUSD: input.stopFeeUSD,
        notes: input.notes,
      },
    },
  };
}