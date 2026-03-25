export interface Registration {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  trackInterest: string;
  dietaryRestrictions?: string;
  tshirtSize?: string;
  ticketType: 'in-person' | 'virtual';
  paymentStatus: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
  accessToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  ticketType: 'in-person' | 'virtual';
  email: string;
  name: string;
  registrationId: string;
}

export interface SponsorInquiry {
  id?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  tierInterest: 'platinum' | 'gold' | 'silver';
  message?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface SponsorOnboarding {
  id?: string;
  sponsorId: string;
  tier: 'platinum' | 'gold' | 'silver';
  companyLogo: string;
  companyBio: string;
  boothPreferences?: string;
  attendeeNames: string[];
  sponsorPackageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAccess {
  token: string;
  registrationId: string;
  ticketType: 'in-person' | 'virtual';
  attendeeName: string;
  email: string;
  isValid: boolean;
  createdAt: string;
}

export interface EventStats {
  totalRegistrations: number;
  inPersonCount: number;
  virtualCount: number;
  totalRevenue: number;
  sponsorCount: number;
  sponsorsByTier: {
    platinum: number;
    gold: number;
    silver: number;
  };
  registrationsByDay: Record<string, number>;
}

export interface SponsorTier {
  name: 'platinum' | 'gold' | 'silver';
  price: number;
  label: string;
}

export const SPONSOR_TIERS: Record<string, SponsorTier> = {
  platinum: { name: 'platinum', price: 1000000, label: 'Platinum — $10,000' },
  gold: { name: 'gold', price: 500000, label: 'Gold — $5,000' },
  silver: { name: 'silver', price: 250000, label: 'Silver — $2,500' },
};
