export interface FaqItem {
  id: string;
  category: 'LEVITATION' | 'STUDIO_AI' | 'PRINTING' | 'ORDERS' | 'WALLET' | string;
  question: string;
  answer: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const FAQ_CATEGORIES = [
  { id: 'LEVITATION', name: 'Levitation & Magnetic Physics', color: 'cyan' },
  { id: 'STUDIO_AI', name: '3D Studio & AI Generation', color: 'indigo' },
  { id: 'PRINTING', name: 'Materials & Inductive Lighting', color: 'purple' },
  { id: 'ORDERS', name: 'Orders, Shipping & WORM Ledger', color: 'emerald' },
  { id: 'WALLET', name: 'Pricing & Prepaid Wallet', color: 'amber' },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-001',
    category: 'LEVITATION',
    question: 'How does the magnetic base keep the 3D sculpture floating without falling?',
    answer: 'Our active electromagnetic base utilizes high-precision Hall-effect sensors sampling magnetic flux 1,000 times per second. Micro-coils dynamically adjust current to counterbalance gravity against an N52 neodymium core embedded in the statue, allowing it to perpetually hover and rotate smoothly.',
    is_published: true,
    order_index: 1,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-002',
    category: 'LEVITATION',
    question: 'Does the floating sculpture require batteries to stay suspended or illuminated?',
    answer: 'No internal batteries are needed. The levitation base plugs into standard AC power (100V–240V). For statues with internal glowing LEDs, power is transmitted wirelessly through the air via resonant inductive magnetic coupling directly into micro-coils hollowed inside the sculpture.',
    is_published: true,
    order_index: 2,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-003',
    category: 'STUDIO_AI',
    question: 'Can I generate a 3D model from a single 2D photo or sketch?',
    answer: 'Yes! Our integrated 3D Studio connects directly to our neural reconstruction engine. You can upload a photo of your pet, character artwork, or describe any concept in plain text, and generate a watertight 3D model preview in under 60 seconds.',
    is_published: true,
    order_index: 3,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-004',
    category: 'STUDIO_AI',
    question: 'What happens if the AI model requires manual mesh repairs or weight balancing?',
    answer: 'Every customer order undergoes an automated center-of-gravity (CoG) analysis. If the statue has complex overhangs or irregular center-of-mass, our certified 3D CAD design partners refine the mesh and calibrate the magnet cavity before physical 3D printing begins.',
    is_published: true,
    order_index: 4,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-005',
    category: 'PRINTING',
    question: 'What materials and resins are used for physical printing?',
    answer: 'We manufacture using industrial-grade SLA/DLP photopolymer resin with 50-micron layer resolution for museum-grade surface smoothness. Sculptures with internal illumination are crafted using our proprietary translucent optic resin with custom hollowed 3mm wire conduits.',
    is_published: true,
    order_index: 5,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-006',
    category: 'PRINTING',
    question: 'What is the difference between the Essential Desk Base and Wireless Glowing Core?',
    answer: 'The Essential Desk tier ($149) includes the magnetic levitation base with outer halo lighting. The Wireless Glowing Core ($184, +$35) hollows internal micro-wire conduits through the sculpture and embeds dual inductive resonant LED chips so the floating statue itself glows from the inside.',
    is_published: true,
    order_index: 6,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-007',
    category: 'ORDERS',
    question: 'How long does physical fabrication and delivery take?',
    answer: 'AI generation is instant in the studio. Physical precision printing, magnet calibration, post-curing, and quality inspection take 3 to 5 business days. Worldwide express shipping typically delivers within 3 to 7 business days with continuous GPS checkpoint tracking.',
    is_published: true,
    order_index: 7,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-008',
    category: 'ORDERS',
    question: 'What is the WORM Legal Ledger Certificate?',
    answer: 'Each physical sculpture is assigned a cryptographically signed Write-Once-Read-Many (WORM) certificate. The exact 3D model hash, timestamp, manufacturing partner ID, and legal ownership are permanently chained via SHA-256 blocks that cannot be altered or deleted.',
    is_published: true,
    order_index: 8,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'faq-009',
    category: 'WALLET',
    question: 'How do wallet credits work and can they be refunded?',
    answer: 'You can top up your wallet in your Credential dashboard via credit card. Credits can be used for instant AI 3D model generations in 3D Studio and applied towards physical statue fabrication orders. Any unused wallet balance can be adjusted or refunded by contacting support or through an administrator.',
    is_published: true,
    order_index: 9,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
  },
];
