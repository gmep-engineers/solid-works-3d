export type VendorCategory = '3D_PRINTING' | 'DESIGNER';

export interface VendorProfile {
  id: string;
  name: string;
  category: VendorCategory;
  currency: 'USD' | 'CNY' | 'JPY' | 'EUR' | 'GBP' | 'CAD' | string;
  country: string;
  email: string;
  phone: string;
  contact_person: string;
  facility_location: string;
  specialty: string;
  rating: number;
  sla_adherence_pct: number;
  avg_turnaround_days: number;
  status: 'ACTIVE' | 'DISABLED';
  device_token: string;
  device_token_issued_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Backwards compatibility alias
export type ManufacturerProfile = VendorProfile;

export const REGISTERED_MANUFACTURERS: VendorProfile[] = [
  // --- 3D Printing & Fabrication Partners ---
  {
    id: 'mfr-shenzhen-apex',
    name: 'Apex Precision 3D',
    category: '3D_PRINTING',
    currency: 'CNY',
    country: 'China',
    email: 'factory@3dprint-supplier.cn',
    phone: '+86 755 8839 2011',
    contact_person: 'Wei Zhang (Lead SLA Engineer)',
    facility_location: 'Shenzhen, CN',
    specialty: 'High-Precision SLA Resin & Electroless Nickel Plating',
    rating: 4.9,
    sla_adherence_pct: 99.4,
    avg_turnaround_days: 3,
    status: 'ACTIVE',
    device_token: 'WIN-APP-APEX-7781-DESKTOP',
    device_token_issued_at: '2026-11-18T10:00:00.000Z',
    notes: 'Certified for 0.05mm tolerance N52 magnetic socket cavities and UV light curing.',
    created_at: '2026-11-01T08:00:00.000Z',
    updated_at: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'mfr-dongguan-resin',
    name: 'Dongguan HyperResin Works',
    category: '3D_PRINTING',
    currency: 'CNY',
    country: 'China',
    email: 'hyperresin@dongguan-mfg.cn',
    phone: '+86 769 8221 4490',
    contact_person: 'Lin Huang (QA & Prototyping Director)',
    facility_location: 'Dongguan, CN',
    specialty: 'Translucent Glow Photopolymers & Inductive Wire Hollowing',
    rating: 4.8,
    sla_adherence_pct: 98.7,
    avg_turnaround_days: 4,
    status: 'ACTIVE',
    device_token: 'WIN-APP-DONGGUAN-9024-DESKTOP',
    device_token_issued_at: '2026-11-18T10:00:00.000Z',
    notes: 'Specializes in phosphorescent glow additives and thin-wall wire channels.',
    created_at: '2026-11-05T08:00:00.000Z',
    updated_at: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'mfr-pacific-proto',
    name: 'Pacific Prototyping Labs',
    category: '3D_PRINTING',
    currency: 'USD',
    country: 'United States',
    email: 'ops@pacific-prototyping.us',
    phone: '+1 (503) 902-8812',
    contact_person: 'Marcus Vance (Senior Mechatronics Tech)',
    facility_location: 'Beaverton, OR, USA',
    specialty: 'Rapid Domestic Prototyping & Dynamic Magnetic Levitation Balancing',
    rating: 5.0,
    sla_adherence_pct: 99.8,
    avg_turnaround_days: 2,
    status: 'ACTIVE',
    device_token: 'WIN-APP-PACIFIC-5510-DESKTOP',
    device_token_issued_at: '2026-11-18T10:00:00.000Z',
    notes: 'Domestic US rapid response facility. On-site dynamic Gauss balancing rigs.',
    created_at: '2026-11-10T08:00:00.000Z',
    updated_at: '2026-11-18T10:00:00.000Z',
  },

  // --- 3D CAD & Sculpt Designers (Design Fine-Tune) ---
  {
    id: 'vendor-neotokyo-sculpt',
    name: 'NeoTokyo Sculpt & CAD Studio',
    category: 'DESIGNER',
    currency: 'JPY',
    country: 'Japan',
    email: 'cad@neotokyo-sculpt.jp',
    phone: '+81 3 5590 8211',
    contact_person: 'Kenji Sato (Lead 3D Character Sculptor)',
    facility_location: 'Tokyo, Japan',
    specialty: '3D Sculpt Fine-Tuning, N52 Cavity Hollowing & Mesh Topology Repair',
    rating: 4.95,
    sla_adherence_pct: 99.6,
    avg_turnaround_days: 1,
    status: 'ACTIVE',
    device_token: 'WIN-APP-NEOTOKYO-4412-DESKTOP',
    device_token_issued_at: '2026-11-19T09:00:00.000Z',
    notes: 'Master anime/statue modeler. Specializes in sculpting stable center-of-gravity bases.',
    created_at: '2026-11-12T08:00:00.000Z',
    updated_at: '2026-11-19T09:00:00.000Z',
  },
  {
    id: 'vendor-polymorph-cad',
    name: 'PolyMorph 3D Design Lab',
    category: 'DESIGNER',
    currency: 'CAD',
    country: 'Canada',
    email: 'studio@polymorph-cad.ca',
    phone: '+1 (604) 771-3390',
    contact_person: 'Elena Rostova (Principal CAD Mechatronics)',
    facility_location: 'Vancouver, BC, Canada',
    specialty: 'Center-of-Mass Dynamic Balancing & Internal LED Conduit Routing',
    rating: 4.88,
    sla_adherence_pct: 99.1,
    avg_turnaround_days: 2,
    status: 'ACTIVE',
    device_token: 'WIN-APP-POLYMORPH-8823-DESKTOP',
    device_token_issued_at: '2026-11-19T09:00:00.000Z',
    notes: 'Expert in Boolean slicing, magnetic field simulation, and wire conduits.',
    created_at: '2026-11-14T08:00:00.000Z',
    updated_at: '2026-11-19T09:00:00.000Z',
  },
];

export const REGISTERED_VENDORS = REGISTERED_MANUFACTURERS;
