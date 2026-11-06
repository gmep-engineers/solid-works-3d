import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Layers,
  Wrench,
  Truck,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  Calendar,
  Check,
  ChevronRight,
  Shield,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  Flame,
  Box,
  Compass,
  Lightbulb,
  Type,
  Crosshair,
  Move,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Save,
  FolderOpen,
  Cpu
} from 'lucide-react';

export const TECHNOLOGIES = [
  {
    id: 'dmls_metal',
    name: 'DMLS / SLM Metal 3D Printing',
    shortName: 'DMLS Metal',
    badge: 'Direct Laser Melting',
    icon: '⚡',
    description: 'High-energy fiber laser powder bed fusion for aerospace titanium, stainless steel, aluminum, and nickel superalloys.'
  },
  {
    id: 'sla_optical',
    name: 'SLA Optical Clear Resins (Custom Light)',
    shortName: 'SLA Optical',
    badge: 'Photopolymer Optics',
    icon: '✨',
    description: 'Ultra-high resolution stereolithography with crystal-clear refractive polyacrylates for custom illumination and optical diffusers.'
  },
  {
    id: 'hybrid_luminaire',
    name: 'Hybrid Metal + Optical Luminaire',
    shortName: 'Hybrid Multi-Material',
    badge: 'Dual Additive Composite',
    icon: '💡',
    description: 'Co-engineered dual process: structural DMLS aluminum heatsink base combined with optical-clear SLA light diffusion shade.'
  }
];

export const TECH_OPTIONS_CONFIG = {
  dmls_metal: {
    finishes: ['as_printed', 'vibratory_tumble', 'electrochemical', 'mirror_polish'],
    defaultFinish: 'as_printed',
    treatments: [
      {
        id: 'none',
        name: 'As-Solidified (None)',
        badge: 'Standard',
        price: 0,
        desc: 'Standard post-print state with support removal. Suitable for non-critical non-load-bearing prototypes.'
      },
      {
        id: 'stress_relief',
        name: 'Vacuum Stress Relief',
        badge: 'Recommended',
        price: 85,
        desc: 'High-vacuum thermal soak cycle to dissipate extreme thermal gradients and eliminate build residual stresses.'
      },
      {
        id: 'hip',
        name: 'Hot Isostatic Pressing (HIP)',
        badge: 'Aerospace Grade',
        price: 220,
        desc: '100+ MPa inert argon gas pressure at 1150°C+ to collapse internal gas pores and voids to 99.9%+ theoretical density.'
      },
      {
        id: 'solution_aging',
        name: 'Solution Anneal & Aging',
        badge: 'Max Hardness',
        price: 140,
        desc: 'Multi-stage solutionizing followed by precipitation aging for peak tensile strength, hardness, and fatigue endurance.'
      }
    ],
    defaultTreatment: 'stress_relief',
    bases: [
      { id: 'none', name: 'None (Bare Part)', price: 0, desc: 'Standard part with no display mount.' },
      { id: 'cnc_aluminum', name: 'Anodized 6061-T6 Aluminum', price: 95, desc: 'Satin bead-blasted billet aerospace aluminum plinth.' },
      { id: 'walnut_brass', name: 'American Walnut & Brass', price: 145, desc: 'Solid hand-rubbed walnut pedestal with brushed brass insert.' },
      { id: 'carbon_fiber', name: '3K Twill Carbon Fiber', price: 180, desc: 'Autoclaved high-gloss structural carbon fiber stand.' }
    ],
    floating: {
      id: 'mag_levitation',
      title: 'Anti-Gravity Magnetic Floating',
      price: 280,
      desc: 'Active electromagnetic suspension platform levitating the metal component mid-air with silent 360° frictionless rotation.'
    },
    illuminationOptions: [
      { id: 'none', label: 'None (Ambient Display Only)', price: 0 },
      { id: 'edge_glow_white', label: 'Halo 4000K Halcyon White Edge Rim Glow (+$65)', price: 65 },
      { id: 'rgbw_app', label: 'Smart RGBW Dynamic App-Controlled Spectrum Halo (+$110)', price: 110 },
      { id: 'warm_edison_2700k', label: '✨ Warm Edison 2700K Core (+$48) [DFM Notice: Occluded by watertight metal]', price: 48 },
      { id: 'architectural_4000k', label: '💡 4000K Pure Neutral Core (+$48) [DFM Notice: Occluded by watertight metal]', price: 48 }
    ]
  },
  sla_optical: {
    finishes: ['optical_diamond_coat', 'frosted_matte_diffusion', 'vapor_smoothing', 'dyeing_tinting', 'uv_cure_wash'],
    defaultFinish: 'optical_diamond_coat',
    treatments: [
      {
        id: 'uv_ambient_cure',
        name: 'Ambient 405nm UV Post-Cure',
        badge: 'Standard',
        price: 0,
        desc: 'Multi-angle 405nm ultraviolet light chamber providing uniform baseline photopolymer crosslinking.'
      },
      {
        id: 'thermal_uv_anneal',
        name: '60°C Isothermal Bake & UV Anneal',
        badge: 'High Rigidity',
        price: 45,
        desc: 'Elevated thermal chamber soak at 60°C with high-flux UV exposure to reach 100% cure conversion and eliminate green-state deflection.'
      },
      {
        id: 'optical_degas',
        name: 'Vacuum Degas & Clarity Bath',
        badge: 'UltraClear Spec',
        price: 55,
        desc: 'Ultrasonic vacuum de-aeration cycle evacuating microscopic bubbles for crystal water-clear transmission (92% T).'
      },
      {
        id: 'inert_chamber_cure',
        name: 'Nitrogen-Purged High-Flux UV Chamber',
        badge: 'Anti-Yellowing',
        price: 75,
        desc: 'Oxygen-depleted inert nitrogen atmosphere preventing oxygen inhibition, surface tackiness, and UV yellowing.'
      }
    ],
    defaultTreatment: 'thermal_uv_anneal',
    bases: [
      { id: 'none', name: 'None (Bare Part)', price: 0, desc: 'Standard part with no display mount.' },
      { id: 'frosted_acrylic_led', name: 'Frosted Edge-Lit Acrylic Plinth', price: 115, desc: 'Precision CNC routed cast acrylic pedestal with concealed cable conduit and edge lighting.' },
      { id: 'walnut_brass', name: 'Walnut & Brass (Concealed Cable)', price: 145, desc: 'Hand-oiled walnut pedestal with internal cable channel for hidden luminaire wiring.' },
      { id: 'cnc_aluminum', name: 'Anodized 6061-T6 Aluminum', price: 95, desc: 'Satin bead-blasted billet aerospace aluminum plinth.' },
      { id: 'carbon_fiber', name: '3K Twill Carbon Fiber', price: 180, desc: 'Autoclaved high-gloss structural carbon fiber stand.' }
    ],
    floating: {
      id: 'mag_levitation',
      title: 'Suspended Luminaire Mid-Air Magnetic Floating',
      price: 280,
      desc: 'Active electromagnetic suspension floating the translucent optical luminaire mid-air with silent 360° frictionless rotation.'
    },
    illuminationOptions: [
      { id: 'none', label: 'None (Ambient Display Only)', price: 0 },
      { id: 'warm_edison_2700k', label: '✨ Warm Edison 2700K Luminaire Core (+$48) [Recommended for Custom Light]', price: 48 },
      { id: 'architectural_4000k', label: '💡 4000K Pure Neutral Architectural Core (+$48)', price: 48 },
      { id: 'smart_rgbw_touch', label: '🌈 Smart RGBW Touch Dimmer Luminaire Engine (+$78)', price: 78 },
      { id: 'edge_glow_white', label: 'Halo 4000K Halcyon White Edge Rim Glow (+$65)', price: 65 }
    ]
  },
  hybrid_luminaire: {
    finishes: ['hybrid_dual_finish', 'optical_diamond_coat', 'vapor_smoothing', 'mirror_polish'],
    defaultFinish: 'hybrid_dual_finish',
    treatments: [
      {
        id: 'hybrid_dual_cure',
        name: 'Dual-Stage Metal Stress Relief & Optical UV Cure',
        badge: 'Composite Grade',
        price: 110,
        desc: 'Pre-assembly vacuum thermal soak of aluminum heatsink chassis followed by automated multi-wavelength UV resin curing.'
      },
      {
        id: 'thermal_uv_anneal',
        name: '60°C Isothermal Bake & UV Annealing',
        badge: 'High Rigidity',
        price: 45,
        desc: 'Elevated thermal chamber soak at 60°C with high-flux UV exposure to reach 100% cure conversion.'
      },
      {
        id: 'stress_relief',
        name: 'Vacuum Stress Relief (Metal Chassis Only)',
        badge: 'Stress-Relieved',
        price: 85,
        desc: 'Vacuum furnace stress relieving on metal base prior to optical polymer over-molding.'
      }
    ],
    defaultTreatment: 'hybrid_dual_cure',
    bases: [
      { id: 'none', name: 'None (Bare Part)', price: 0, desc: 'Standard part with no display mount.' },
      { id: 'hybrid_duo_pedestal', name: 'Billet Aluminum & Walnut Duo Pedestal', price: 160, desc: 'Architectural dual-material plinth pairing satin 6061-T6 aluminum with hand-oiled American walnut.' },
      { id: 'cnc_aluminum', name: 'Anodized 6061-T6 Aluminum', price: 95, desc: 'Satin bead-blasted billet aerospace aluminum plinth.' },
      { id: 'carbon_fiber', name: '3K Twill Carbon Fiber', price: 180, desc: 'Autoclaved high-gloss structural carbon fiber stand.' }
    ],
    floating: {
      id: 'mag_levitation',
      title: 'Wireless Induction Power Levitating Base',
      price: 320,
      desc: 'Active mid-air electromagnetic levitation with wireless inductive power transfer continuously energizing the internal LED engine.'
    },
    illuminationOptions: [
      { id: 'none', label: 'None (Ambient Display Only)', price: 0 },
      { id: 'warm_edison_2700k', label: '✨ Warm Edison 2700K Luminaire Core (+$48) [Recommended for Custom Light]', price: 48 },
      { id: 'smart_rgbw_touch', label: '🌈 Smart RGBW Touch Dimmer Luminaire Engine (+$78)', price: 78 },
      { id: 'architectural_4000k', label: '💡 4000K Pure Neutral Architectural Core (+$48)', price: 48 },
      { id: 'edge_glow_white', label: 'Halo 4000K Halcyon White Edge Rim Glow (+$65)', price: 65 }
    ]
  }
};

const FALLBACK_MATERIALS = [
  {
    id: 'ti_6al_4v',
    name: 'Titanium Ti-6Al-4V Grade 5',
    technology: 'dmls_metal',
    density_g_cm3: 4.43,
    min_wall_recommended_mm: 0.6,
    color_hex: '#94a3b8',
    description: 'High strength-to-weight ratio, biocompatible, aerospace and medical grade.'
  },
  {
    id: 'ss_316l',
    name: 'Stainless Steel 316L',
    technology: 'dmls_metal',
    density_g_cm3: 7.99,
    min_wall_recommended_mm: 0.8,
    color_hex: '#cbd5e1',
    description: 'Outstanding corrosion resistance, food-safe, chemical and marine engineering.'
  },
  {
    id: 'alsi10mg',
    name: 'Aluminum AlSi10Mg',
    technology: 'dmls_metal',
    density_g_cm3: 2.67,
    min_wall_recommended_mm: 0.8,
    color_hex: '#e2e8f0',
    description: 'Lightweight, high thermal and electrical conductivity, ideal for heat exchangers and automotive.'
  },
  {
    id: 'inconel_718',
    name: 'Inconel 718 Nickel Superalloy',
    technology: 'dmls_metal',
    density_g_cm3: 8.19,
    min_wall_recommended_mm: 0.7,
    color_hex: '#64748b',
    description: 'Retains tensile strength up to 700°C, extreme oxidation resistance for rocket propulsion and turbines.'
  },
  {
    id: 'ss_17_4ph',
    name: 'Stainless Steel 17-4 PH',
    technology: 'dmls_metal',
    density_g_cm3: 7.80,
    min_wall_recommended_mm: 0.8,
    color_hex: '#94a3b8',
    description: 'Precipitation hardened martensitic steel with high hardness and fatigue endurance.'
  },
  {
    id: 'copper_cuni2sicr',
    name: 'Copper Alloy CuNi2SiCr',
    technology: 'dmls_metal',
    density_g_cm3: 8.80,
    min_wall_recommended_mm: 0.8,
    color_hex: '#f97316',
    description: 'High electrical & thermal conductivity alloy for induction coils and rocket combustion liners.'
  },
  {
    id: 'scalmalloy',
    name: 'Scalmalloy (Al-Mg-Sc-Zr)',
    technology: 'dmls_metal',
    density_g_cm3: 2.77,
    min_wall_recommended_mm: 0.7,
    color_hex: '#93c5fd',
    description: 'Aircraft-grade scandium-modified aluminum with specific strength matching titanium.'
  },
  {
    id: 'sla_ultraclear',
    name: 'UltraClear Optical Resin (92% Clear)',
    technology: 'sla_optical',
    density_g_cm3: 1.18,
    min_wall_recommended_mm: 0.5,
    color_hex: '#e0f2fe',
    is_transparent: true,
    optical_transmittance: '92%',
    refractive_index: 1.52,
    description: 'High-transparency acrylic resin for lenses, optical guides, and internal luminaire lamps.'
  },
  {
    id: 'sla_frosted_diffuser',
    name: 'Frosted Opal Light Diffuser Resin',
    technology: 'sla_optical',
    density_g_cm3: 1.16,
    min_wall_recommended_mm: 0.5,
    color_hex: '#f8fafc',
    is_transparent: true,
    optical_transmittance: '78%',
    refractive_index: 1.48,
    description: 'Homogeneous photon-scattering diffuser for soft, glare-free lamp illumination without visible LED hotspots.'
  },
  {
    id: 'sla_amber_crystal',
    name: 'Amber Crystal Vintage Tint Resin',
    technology: 'sla_optical',
    density_g_cm3: 1.18,
    min_wall_recommended_mm: 0.5,
    color_hex: '#f59e0b',
    is_transparent: true,
    optical_transmittance: '86%',
    refractive_index: 1.53,
    description: 'Warm sunset amber translucent crystal. Emits a cozy incandescent Edison glow when lit by warm LED engines.'
  },
  {
    id: 'sla_smoked_obsidian',
    name: 'Smoked Obsidian Translucent Resin',
    technology: 'sla_optical',
    density_g_cm3: 1.19,
    min_wall_recommended_mm: 0.5,
    color_hex: '#334155',
    is_transparent: true,
    optical_transmittance: '72%',
    refractive_index: 1.54,
    description: 'Sleek dark charcoal when off; reveals vivid glowing geometric internal lattice channels when energized.'
  },
  {
    id: 'sla_cyan_luminescent',
    name: 'Cyan Luminescent Edge-Glow Resin',
    technology: 'sla_optical',
    density_g_cm3: 1.17,
    min_wall_recommended_mm: 0.5,
    color_hex: '#06b6d4',
    is_transparent: true,
    optical_transmittance: '90%',
    refractive_index: 1.52,
    description: 'High light-piping optical resin with vibrant neon cyan luminescence concentrated along outer contours and bevels.'
  },
  {
    id: 'hybrid_metal_light',
    name: 'Hybrid Metal + Optical Luminaire',
    technology: 'hybrid_luminaire',
    density_g_cm3: 2.20,
    min_wall_recommended_mm: 0.6,
    color_hex: '#38bdf8',
    is_transparent: true,
    optical_transmittance: '85%',
    refractive_index: 1.52,
    description: 'Co-engineered dual process: DMLS aluminum thermal heatsink chassis combined with optical-clear SLA light diffusion shade.'
  }
];

const FALLBACK_FINISHES = [
  {
    id: 'as_printed',
    name: 'As-Printed (Glass Bead Blast)',
    price: 0.0,
    roughness_ra: '6.3 - 9.0 µm',
    technology: 'dmls_metal',
    description: 'Uniform satin matte appearance, removed residual sintered powder.'
  },
  {
    id: 'vibratory_tumble',
    name: 'Vibratory Tumble Polish',
    price: 38.0,
    roughness_ra: '3.0 - 4.2 µm',
    technology: 'dmls_metal',
    description: 'Deburred edges and smoothed external surfaces using ceramic media.'
  },
  {
    id: 'electrochemical',
    name: 'Electro-Chemical Polish',
    price: 85.0,
    roughness_ra: '1.2 - 2.0 µm',
    technology: 'dmls_metal',
    description: 'Electrolytic bath smoothing, micro-cleaned surface ideal for fluid channels and vacuum systems.'
  },
  {
    id: 'mirror_polish',
    name: 'Optical Mirror Hand Polish',
    price: 165.0,
    roughness_ra: '< 0.4 µm',
    technology: 'dmls_metal',
    description: 'Manual progressive diamond lapping and buffing to high specular reflectance.'
  },
  {
    id: 'optical_diamond_coat',
    name: 'Optical UV Clearcoat & Dip',
    price: 45.0,
    roughness_ra: 'Ra < 0.1 µm',
    technology: 'sla_optical',
    description: 'UV lacquer dip and progressive diamond buffing for 92% optical clarity and high-gloss water-clear look.'
  },
  {
    id: 'frosted_matte_diffusion',
    name: 'Frosted Matte Light Diffusion',
    price: 30.0,
    roughness_ra: 'Ra 2.4 - 3.2 µm',
    technology: 'sla_optical',
    description: 'Soft photon-scattering micro-etching eliminating diode hotspots on custom translucent lamp diffusers.'
  },
  {
    id: 'vapor_smoothing',
    name: 'Chemical Vapor Smoothing',
    price: 55.0,
    roughness_ra: 'Ra 0.4 - 0.8 µm',
    technology: 'sla_optical',
    description: 'Solvent vapor circulation for sealed, glossy, injection-molded tactile feel and liquid-tight seal.'
  },
  {
    id: 'dyeing_tinting',
    name: 'Pigment Dyeing & Tinting',
    price: 40.0,
    roughness_ra: 'Translucent Tint',
    technology: 'sla_optical',
    description: 'Heated deep-penetration dye bath for uniform custom translucent colors and edge glows.'
  },
  {
    id: 'uv_cure_wash',
    name: 'Ultrasonic Wash & Multi-Axis UV Cure',
    price: 0.0,
    roughness_ra: 'Standard Optical',
    technology: 'sla_optical',
    description: 'Automated IPA wash station and multi-angle 405nm UV curing chamber for photopolymer crosslinking.'
  },
  {
    id: 'hybrid_dual_finish',
    name: 'Dual-Finish: Bead Blasted Base + Diamond Clear Optics',
    price: 58.0,
    roughness_ra: 'Hybrid Spec',
    technology: 'hybrid_luminaire',
    description: 'Co-processed finish: satin bead-blasted aluminum heatsink coupled with diamond-polished optical resin optics.'
  }
];

const FALLBACK_LEAD_TIMES = [
  {
    id: 'standard',
    name: 'Standard Production (8 - 10 Business Days)',
    days: 9,
    shipping_cost: 25.0,
    rush_multiplier: 1.0
  },
  {
    id: 'expedited',
    name: 'Expedited Priority (4 - 6 Business Days)',
    days: 5,
    shipping_cost: 75.0,
    rush_multiplier: 1.25
  },
  {
    id: 'rush',
    name: 'Critical Emergency Rush (2 - 3 Business Days)',
    days: 3,
    shipping_cost: 160.0,
    rush_multiplier: 1.6
  }
];

export default function QuoteCalculator({
  modelData,
  technology: propTechnology,
  onTechnologyChange: propOnTechnologyChange,
  selectedMaterial,
  onMaterialChange,
  machining: propMachining,
  setMachining: propSetMachining,
  lightCoords,
  onLightCoordsChange,
  selectedFinish: propSelectedFinish,
  setSelectedFinish: propSetSelectedFinish,
  quantity: propQuantity,
  setQuantity: propSetQuantity,
  selectedLeadTime: propSelectedLeadTime,
  setSelectedLeadTime: propSetSelectedLeadTime,
  onOrderPlaced,
  currentUser,
  onOpenAuth,
  onOpenWalletModal,
  onRequestAutoFix,
  onSaveProjectClick,
  onLoadProjectClick,
  onQuoteCalculated,
  onCaptureSnapshot,
  activeSection: propActiveSection,
  setActiveSection: propSetActiveSection,
  allExpanded: propAllExpanded,
  setAllExpanded: propSetAllExpanded,
  onToggleSection: propOnToggleSection
}) {
  const [config, setConfig] = useState(null);
  const [localTechnology, setLocalTechnology] = useState('dmls_metal');
  const [localQuantity, setLocalQuantity] = useState(1);
  const [localFinish, setLocalFinish] = useState('as_printed');
  const [localLeadTime, setLocalLeadTime] = useState('standard');

  const technology = propTechnology || localTechnology;
  const setTechnology = propOnTechnologyChange || setLocalTechnology;

  const quantity = propQuantity !== undefined ? propQuantity : localQuantity;
  const setQuantity = propSetQuantity || setLocalQuantity;
  const selectedFinish = propSelectedFinish !== undefined ? propSelectedFinish : localFinish;
  const setSelectedFinish = propSetSelectedFinish || setLocalFinish;
  const selectedLeadTime = propSelectedLeadTime !== undefined ? propSelectedLeadTime : localLeadTime;
  const setSelectedLeadTime = propSetSelectedLeadTime || setLocalLeadTime;

  const [localMachining, setLocalMachining] = useState({
    datum_faces: 0,
    tapped_holes: 0,
    reamed_bores: 0,
    wire_edm_cutoff: true,
    heat_treatment: 'stress_relief',
    display_base: 'none',
    floating_system: 'none',
    illumination: 'none',
    custom_engraving: ''
  });
  const machining = propMachining || localMachining;
  const setMachining = propSetMachining || setLocalMachining;

  const [quote, setQuote] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('WALLET'); // 'WALLET' | 'CREDIT_CARD'
  const [walletBalance, setWalletBalance] = useState(0);

  // IP & Legal Disclaimer Clickwrap Gate State
  const [legalDisclaimer, setLegalDisclaimer] = useState(null);
  const [ipTermsAccepted, setIpTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Right Column Accordion state
  const [internalActiveSection, setInternalActiveSection] = useState(1);
  const [internalAllExpanded, setInternalAllExpanded] = useState(false);

  const activeSection = propActiveSection !== undefined ? propActiveSection : internalActiveSection;
  const setActiveSection = propSetActiveSection || setInternalActiveSection;
  const allExpanded = propAllExpanded !== undefined ? propAllExpanded : internalAllExpanded;
  const setAllExpanded = propSetAllExpanded || setInternalAllExpanded;

  const toggleSection = (sectionId) => {
    if (propOnToggleSection) {
      propOnToggleSection(sectionId);
    } else {
      setAllExpanded(false);
      setActiveSection((prev) => (String(prev) === String(sectionId) ? null : sectionId));
    }
  };

  const isSectionExpanded = (sectionId) => {
    if (allExpanded) return true;
    return String(activeSection) === String(sectionId);
  };

  const expandedSections = {
    1: isSectionExpanded(1),
    2: isSectionExpanded(2),
    3: isSectionExpanded(3),
    4: isSectionExpanded(4),
    5: isSectionExpanded(5)
  };

  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState({
    full_name: currentUser?.full_name || '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    phone: ''
  });

  // Load wallet balance
  const loadWallet = () => {
    api.getWallet()
      .then((data) => setWalletBalance(data.balance))
      .catch((err) => console.log('Wallet fetch:', err));
  };

  // Load active IP & Legal Disclaimer Clickwrap Terms
  useEffect(() => {
    if (config?.legal_disclaimer) {
      setLegalDisclaimer(config.legal_disclaimer);
    } else {
      api.getLegalDisclaimer()
        .then(setLegalDisclaimer)
        .catch((err) => console.log('Legal disclaimer fetch note:', err));
    }
  }, [config]);

  // 1. FILTER MATERIALS BY TECHNOLOGY
  const materials = (config?.materials && config.materials.length > 0) ? config.materials : FALLBACK_MATERIALS;
  const filteredMaterials = materials.filter((m) => {
    if (technology === 'dmls_metal') return !m.is_transparent && (!m.technology || m.technology === 'dmls_metal');
    if (technology === 'sla_optical') return m.technology === 'sla_optical' || (m.is_transparent && m.technology !== 'hybrid_luminaire');
    if (technology === 'hybrid_luminaire') return m.technology === 'hybrid_luminaire';
    return true;
  });

  // Current active technology configuration (finishes, treatments, bases, floating, illumination)
  const currentTechConfig = TECH_OPTIONS_CONFIG[technology] || TECH_OPTIONS_CONFIG.dmls_metal;

  // 2. FILTER FINISHES BY TECHNOLOGY
  const finishes = (config?.finishes && config.finishes.length > 0) ? config.finishes : FALLBACK_FINISHES;
  const filteredFinishes = finishes.filter((f) => {
    return currentTechConfig.finishes.includes(f.id);
  });

  // 3. FILTER TREATMENTS BY TECHNOLOGY
  const filteredTreatments = currentTechConfig.treatments;

  // 4. FILTER BASES & ADDONS BY TECHNOLOGY
  const filteredBases = currentTechConfig.bases;
  const floatingConfig = currentTechConfig.floating;
  const filteredIllumination = currentTechConfig.illuminationOptions;

  // Fetch quoting config on load
  useEffect(() => {
    api.getQuoteConfig()
      .then((res) => {
        if (res && res.materials && res.materials.length > 0) {
          setConfig(res);
        }
      })
      .catch((err) => console.error('Failed to load quote config:', err));
  }, []);

  // AUTOMATIC SYNCHRONIZATION WHEN TECHNOLOGY CHANGES:
  // Auto-filter materials, finishes, treatments, display bases, and illumination
  const handleSelectTechnology = (techId) => {
    if (techId === technology) return;
    setTechnology(techId);

    const nextConfig = TECH_OPTIONS_CONFIG[techId] || TECH_OPTIONS_CONFIG.dmls_metal;

    // Filter materials for the new tech
    const matchingMaterials = materials.filter((m) => {
      if (techId === 'dmls_metal') return !m.is_transparent && (!m.technology || m.technology === 'dmls_metal');
      if (techId === 'sla_optical') return m.technology === 'sla_optical' || (m.is_transparent && m.technology !== 'hybrid_luminaire');
      if (techId === 'hybrid_luminaire') return m.technology === 'hybrid_luminaire';
      return true;
    });

    if (matchingMaterials.length > 0 && (!matchingMaterials.some(m => m.id === selectedMaterial))) {
      onMaterialChange(matchingMaterials[0].id);
    }

    // Auto-select valid default finish
    setSelectedFinish(nextConfig.defaultFinish);

    // Auto-select valid treatment, display base, and wire EDM setting
    setMachining((m) => ({
      ...m,
      heat_treatment: nextConfig.defaultTreatment,
      wire_edm_cutoff: techId !== 'sla_optical',
      display_base: 'none',
      illumination: techId === 'dmls_metal' && ['warm_edison_2700k', 'architectural_4000k', 'smart_rgbw_touch'].includes(m.illumination)
        ? 'none'
        : m.illumination
    }));
  };

  // Ensure current material belongs to filtered materials
  useEffect(() => {
    if (filteredMaterials.length > 0 && !filteredMaterials.some(m => m.id === selectedMaterial)) {
      onMaterialChange(filteredMaterials[0].id);
    }
  }, [technology, selectedMaterial, filteredMaterials, onMaterialChange]);

  // Ensure current finish belongs to filtered finishes
  useEffect(() => {
    if (filteredFinishes.length > 0 && !filteredFinishes.some(f => f.id === selectedFinish)) {
      setSelectedFinish(currentTechConfig.defaultFinish);
    }
  }, [technology, selectedFinish, filteredFinishes, setSelectedFinish, currentTechConfig]);

  // Update default shipping name when user changes
  useEffect(() => {
    if (currentUser?.full_name && !shippingAddress.full_name) {
      setShippingAddress((prev) => ({ ...prev, full_name: currentUser.full_name }));
    }
  }, [currentUser]);

  // Re-calculate quote whenever parameters change
  useEffect(() => {
    if (!modelData) {
      setQuote(null);
      return;
    }

    setIsCalculating(true);
    api.calculateQuote({
      model_id: modelData.id,
      material_id: selectedMaterial,
      quantity: quantity,
      finish_id: selectedFinish,
      machining_options: machining,
      lead_time_id: selectedLeadTime
    })
      .then((data) => {
        setQuote(data);
        setIsCalculating(false);
        if (onQuoteCalculated) {
          onQuoteCalculated(data);
        }
      })
      .catch((err) => {
        console.error('Quote calculation error:', err);
        setIsCalculating(false);
      });
  }, [modelData, selectedMaterial, quantity, selectedFinish, machining, selectedLeadTime]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!ipTermsAccepted) {
      alert("Mandatory Clickwrap Gate: You must certify the intellectual property ownership declaration and accept the IP & Indemnification terms to authorize production.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const ipAcceptedAt = new Date().toISOString();
      const ipVersion = legalDisclaimer?.version || '1.0';
      const snapshotUrl = onCaptureSnapshot ? onCaptureSnapshot() : null;

      const savedQuote = await api.saveQuote({
        model_id: modelData.id,
        material_id: selectedMaterial,
        quantity: quantity,
        finish_id: selectedFinish,
        machining_options: machining,
        lead_time_id: selectedLeadTime,
        ip_terms_accepted: true,
        ip_terms_version: ipVersion,
        ip_terms_accepted_at: ipAcceptedAt,
        cad_thumbnail_data_url: snapshotUrl
      });

      const orderData = {
        quote_id: savedQuote.id,
        shipping_address: shippingAddress,
        notes: `Selected Technology: ${technology.toUpperCase()} • Part Material: ${selectedMaterial} • Secondary Ops: ${JSON.stringify(machining)}`,
        payment_method: paymentMethod,
        ip_terms_accepted: true,
        ip_terms_version: ipVersion,
        ip_terms_accepted_at: ipAcceptedAt,
        cad_thumbnail_data_url: snapshotUrl
      };

      const order = await api.createOrder(orderData);
      setIsPlacingOrder(false);
      setShowCheckoutModal(false);
      if (paymentMethod === 'WALLET') {
        loadWallet();
      }
      if (onOrderPlaced) {
        onOrderPlaced(order);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to complete checkout');
      setIsPlacingOrder(false);
    }
  };

  const leadTimes = (config?.lead_times && config.lead_times.length > 0) ? config.lead_times : FALLBACK_LEAD_TIMES;

  if (!modelData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h4 className="text-base font-semibold text-slate-300">Upload or Select a SolidWorks Model</h4>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Upload your CAD part to perform automated thickness analysis and receive an instant metal 3D printing & machining quote.
        </p>
      </div>
    );
  }

  const currentMaterial = materials.find((m) => m.id === selectedMaterial) || filteredMaterials[0] || materials[0];
  const currentFinish = finishes.find((f) => f.id === selectedFinish) || filteredFinishes[0] || finishes[0];
  const currentHeatTreatment = filteredTreatments.find((t) => t.id === machining.heat_treatment) || filteredTreatments[0];
  const currentBase = filteredBases.find((b) => b.id === machining.display_base) || filteredBases[0];

  return (
    <div className="space-y-4">
      {(modelData.dfm_status === 'FAIL' || modelData.min_thickness_mm < 0.8) && !modelData.is_auto_repaired && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <span className="font-semibold text-amber-300">DFM Notice:</span> Sub-millimeter features or thin walls detected ({modelData.min_thickness_mm?.toFixed(2)} mm). Instant pricing is active.
            </div>
          </div>
          {onRequestAutoFix && (
            <button
              type="button"
              onClick={onRequestAutoFix}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shrink-0 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Fix Geometry...
            </button>
          )}
        </div>
      )}

      {/* 1. Metal Alloy & Optical Resin Technology Selection */}
      <div id="quote-section-1" className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(1)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              currentMaterial?.is_transparent
                ? 'bg-amber-500/10 border border-amber-500/30'
                : 'bg-cyan-500/10 border border-cyan-500/30'
            }`}>
              {currentMaterial?.is_transparent ? (
                <Lightbulb className="w-4 h-4 text-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white text-sm">1. Printing Technology & Material</h3>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  [{TECHNOLOGIES.find(t => t.id === technology)?.shortName || 'DMLS Metal'}]
                </span>
                {currentMaterial?.is_transparent && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lightbulb className="w-2.5 h-2.5" /> Custom Light Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                <span className={currentMaterial?.is_transparent ? 'text-amber-300 font-semibold' : 'text-cyan-300 font-semibold'}>
                  {currentMaterial?.name}
                </span>
                <span className="text-slate-500 mx-1.5">•</span>
                <span className="font-mono text-slate-400">ρ = {currentMaterial?.density_g_cm3} g/cm³</span>
                <span className="text-slate-500 mx-1.5">•</span>
                <span className="text-slate-400">Min wall ≥ {currentMaterial?.min_wall_recommended_mm} mm</span>
                {currentMaterial?.is_transparent && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-amber-300/90 font-mono">Transmission: {currentMaterial?.optical_transmittance || '92%'}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-3.5 h-3.5 rounded-full border hidden sm:inline-block shrink-0 ${
                currentMaterial?.is_transparent ? 'border-amber-400 shadow-sm shadow-amber-400/40' : 'border-slate-700'
              }`}
              style={{ backgroundColor: currentMaterial?.color_hex }}
            />
            <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1">
              <span className="hidden sm:inline">{expandedSections[1] ? 'Collapse' : 'Change Material'}</span>
              {expandedSections[1] ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
              )}
            </span>
          </div>
        </button>

        {expandedSections[1] && (
          <div className="p-5 pt-3 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
            {/* Primary Technology Cards: Click to filter materials, finishes, treatments, CNC ops, and addons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Select 3D Printing Technology:
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Filters all materials, finishes, treatments, CNC ops & add-ons
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {TECHNOLOGIES.map((tech) => {
                  const isSelected = technology === tech.id;
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleSelectTechnology(tech.id)}
                      className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? tech.id === 'sla_optical'
                            ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                            : tech.id === 'hybrid_luminaire'
                            ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                            : 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                            <span className="text-sm">{tech.icon}</span>
                            {tech.shortName}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isSelected
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {tech.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {tech.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                        <span className={isSelected ? 'text-white font-bold' : 'text-slate-500'}>
                          {isSelected ? '● Active Fleet Tech' : 'Click to Select'}
                        </span>
                        <span className={tech.id === 'sla_optical' ? 'text-amber-400' : tech.id === 'hybrid_luminaire' ? 'text-purple-400' : 'text-cyan-400'}>
                          {tech.id === 'sla_optical' ? '5 Optic Resins' : tech.id === 'hybrid_luminaire' ? 'Composite' : '7 Metal Alloys'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Light Transparency Notice when transparent resin is chosen */}
            {currentMaterial?.is_transparent && (
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/30 border border-amber-500/40 rounded-xl p-3 flex items-start gap-3 shadow-md">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-amber-300">Custom Light / Transparent Mode Active:</span>{' '}
                  <span className="text-slate-300 leading-relaxed">
                    This material features optical transmission and refractive index matched to glass (n=1.52). In the 3D viewer above, internal lamp illumination shines through walls with physically accurate real-time subsurface scattering.
                  </span>
                </div>
              </div>
            )}

            {/* Filtered Materials Grid for the Selected Technology */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Compatible Material Cards ({filteredMaterials.length} available):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMaterials.map((mat) => {
                  const isSelected = selectedMaterial === mat.id;
                  const isTrans = Boolean(mat.is_transparent);
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => onMaterialChange(mat.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? isTrans
                            ? 'bg-amber-950/30 border-amber-400 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40'
                            : 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5 flex-wrap">
                            {mat.name}
                            {isTrans && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-sans">
                                <Lightbulb className="w-2.5 h-2.5" /> Clear
                              </span>
                            )}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                              isTrans ? 'border-amber-400/80 shadow-sm shadow-amber-400/50' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: mat.color_hex }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {mat.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">ρ = {mat.density_g_cm3} g/cm³</span>
                        <span className={isTrans ? 'text-amber-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                          {isTrans ? `Optical Trans: ${mat.optical_transmittance || '92%'}` : `Min Wall ≥ ${mat.min_wall_recommended_mm} mm`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Surface Finishing & Cosmetic Treatments (Filtered by Technology) */}
      <div id="quote-section-2" className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(2)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">2. Surface Finishing & Cosmetic Treatments</h3>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  [{TECHNOLOGIES.find(t => t.id === technology)?.shortName || 'Technology Filtered'}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                <span className="text-cyan-300 font-semibold">{currentFinish?.name}</span>
                <span className="text-slate-500 mx-1.5">•</span>
                <span className="font-mono text-slate-400">Spec: {currentFinish?.roughness_ra || currentFinish?.spec_detail || 'Standard'}</span>
                {(currentFinish?.price ?? currentFinish?.base_price ?? 0) > 0 && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-amber-300 font-mono">+${currentFinish?.price ?? currentFinish?.base_price}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(currentFinish?.price ?? currentFinish?.base_price ?? 0) === 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800 hidden sm:inline">
                Included
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hidden sm:inline">
                +${currentFinish?.price ?? currentFinish?.base_price}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1">
              <span className="hidden sm:inline">{expandedSections[2] ? 'Collapse' : 'Change Finish'}</span>
              {expandedSections[2] ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
              )}
            </span>
          </div>
        </button>

        {expandedSections[2] && (
          <div className="p-5 pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
            <p className="text-xs text-slate-400 leading-relaxed">
              Filtered specifically for <strong>{TECHNOLOGIES.find(t => t.id === technology)?.name}</strong>: Select mechanical, chemical, optical dips, or vapor smoothing tailored to this additive process.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              {filteredFinishes.map((f) => {
                const active = selectedFinish === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinish(f.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      active
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={active ? 'text-cyan-300' : 'text-slate-200'}>{f.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {f.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        Spec: <strong className="text-slate-300">{f.roughness_ra || f.spec_detail || 'Standard'}</strong>
                      </span>
                      <span className={`font-bold ${active ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {(f.price ?? f.base_price ?? 0) === 0 ? 'Included' : `+$${f.price ?? f.base_price}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Metallurgical Heat Treatment / Resin UV Curing & Annealing (Filtered by Technology) */}
      <div id="quote-section-3" className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(3)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  {technology === 'sla_optical'
                    ? '3. Photopolymer UV Post-Curing & Annealing'
                    : technology === 'hybrid_luminaire'
                    ? '3. Dual-Process Thermal Soak & Secondary UV Curing'
                    : '3. Metallurgical Heat Treatment & HIP'}
                </h3>
                <span className="text-xs text-orange-400/90 font-mono hidden sm:inline">
                  [{TECHNOLOGIES.find(t => t.id === technology)?.shortName || 'Process Filtered'}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                <span className="text-orange-300 font-semibold">{currentHeatTreatment?.name}</span>
                <span className="text-slate-500 mx-1.5">•</span>
                <span className="text-slate-400">
                  {currentHeatTreatment?.price === 0 ? 'Standard Process' : `+$${currentHeatTreatment?.price} Cycle`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentHeatTreatment?.price === 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800 hidden sm:inline">
                Included
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30 hidden sm:inline">
                +${currentHeatTreatment?.price}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 group-hover:text-orange-300 flex items-center gap-1">
              <span className="hidden sm:inline">{expandedSections[3] ? 'Collapse' : 'Change Cycle'}</span>
              {expandedSections[3] ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-orange-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-orange-300" />
              )}
            </span>
          </div>
        </button>

        {expandedSections[3] && (
          <div className="p-5 pt-3 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
            <p className="text-xs text-slate-400 leading-relaxed">
              {technology === 'sla_optical'
                ? 'Precision ultraviolet light crosslinking chambers, elevated thermal anneals, and vacuum degas cycles calibrated for optical photopolymer resins.'
                : technology === 'hybrid_luminaire'
                ? 'Co-engineered dual cycles: vacuum thermal soak of aluminum chassis followed by high-flux multi-wavelength UV resin curing.'
                : 'Volumetric high-temperature vacuum furnace and high-pressure argon cycles applied across the entire metal component to relieve residual thermal stress, homogenize dendritic microstructures, or close internal micro-porosity to 99.9% density.'}
            </p>

            {/* Treatment Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {filteredTreatments.map((ht) => {
                const isSelected = (machining.heat_treatment || currentTechConfig.defaultTreatment) === ht.id;
                return (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => setMachining((m) => ({ ...m, heat_treatment: ht.id }))}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-950/40 border-orange-400 text-orange-200 shadow-md shadow-orange-950/50 ring-1 ring-orange-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold gap-1">
                        <span className={isSelected ? 'text-orange-300' : 'text-slate-200'}>{ht.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isSelected ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ht.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                        {ht.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Cure / Furnace</span>
                      <span className={`font-bold ${isSelected ? 'text-orange-300' : 'text-slate-300'}`}>
                        {ht.price === 0 ? 'Included' : `+$${ht.price}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Exhibition Bases, Magnetic Floating & Illumination Systems (Filtered by Technology) */}
      <div id="quote-section-4" className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(4)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">4. Exhibition Bases, Magnetic Floating & Illumination</h3>
                <span className="text-xs text-indigo-400/90 font-mono hidden sm:inline">
                  [{TECHNOLOGIES.find(t => t.id === technology)?.shortName || 'Process Filtered'}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                <span className="text-indigo-300 font-semibold">{currentBase?.name}</span>
                {(machining.floating_system || 'none') === 'mag_levitation' && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-cyan-300 font-mono">{floatingConfig.title} (+${floatingConfig.price})</span>
                  </>
                )}
                {machining.illumination && machining.illumination !== 'none' && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-amber-300 font-mono">Halo / Core LED</span>
                  </>
                )}
                {Boolean(machining.custom_engraving?.trim()) && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-purple-300">Engraved Plaque</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {((currentBase?.price || 0) + ((machining.floating_system === 'mag_levitation') ? floatingConfig.price : 0)) > 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hidden sm:inline">
                Showcase Add-on
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800 hidden sm:inline">
                Optional
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-300 flex items-center gap-1">
              <span className="hidden sm:inline">{expandedSections[4] ? 'Collapse' : 'Customize Hardware'}</span>
              {expandedSections[4] ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" />
              )}
            </span>
          </div>
        </button>

        {expandedSections[4] && (
          <div className="p-5 pt-3 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-150">
            <p className="text-xs text-slate-400 leading-relaxed">
              Filtered add-on hardware specifically matched for <strong>{TECHNOLOGIES.find(t => t.id === technology)?.name}</strong>: exhibition plinths, magnetic floating systems, and optical illumination engines.
            </p>

            {/* 4A: Exhibition Base Selection (Filtered by Technology) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-indigo-400" />
                  Exhibition Plinth / Base
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Matched to {technology.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredBases.map((base) => {
                  const active = (machining.display_base || 'none') === base.id;
                  return (
                    <button
                      key={base.id}
                      type="button"
                      onClick={() => setMachining((m) => ({ ...m, display_base: base.id }))}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-950/40 border-indigo-400 text-indigo-200 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{base.name}</div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{base.desc}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Mount</span>
                        <span className={`font-bold ${active ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {base.price === 0 ? 'Included' : `+$${base.price}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4B: Magnetic Floating System & Illumination in 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Magnetic Floating System (Filtered / Adapted) */}
              <div className={`p-4 rounded-xl border transition-all ${
                (machining.floating_system || 'none') === 'mag_levitation'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">{floatingConfig.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">+${floatingConfig.price}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {floatingConfig.desc}
                </p>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400">
                    {(machining.floating_system || 'none') === 'mag_levitation' ? 'Active Floating Enabled' : 'Disabled (Static)'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(machining.floating_system || 'none') === 'mag_levitation'}
                      onChange={(e) => setMachining((m) => ({
                        ...m,
                        floating_system: e.target.checked ? 'mag_levitation' : 'none'
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              {/* Illumination / Custom Light Luminaire Engine (Filtered by Technology) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {technology === 'sla_optical' || technology === 'hybrid_luminaire'
                        ? 'Custom Luminaire Light Engine'
                        : 'Showcase Illumination'}
                    </span>
                  </div>
                  {currentMaterial?.is_transparent && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                      Custom Light
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {technology === 'sla_optical'
                    ? 'Internal high-CRI light engine specifically engineered to illuminate transparent optical resin channels, lenses, and diffusers.'
                    : technology === 'hybrid_luminaire'
                    ? 'Integrated thermal heatsink LED engine designed for dual-material metal + optical composite assemblies.'
                    : 'Concealed LED edge lighting designed to accentuate reflective metallic contours and high-specular finishes.'}
                </p>
                <select
                  value={machining.illumination || 'none'}
                  onChange={(e) => setMachining((m) => ({ ...m, illumination: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer mt-1"
                >
                  {filteredIllumination.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {machining.illumination && machining.illumination !== 'none' && !currentMaterial?.is_transparent && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2 mt-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-[11px] text-amber-300">
                        DFM Optical Notice: Opaque Metal Occludes Internal Lighting
                      </span>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {currentMaterial?.name || 'Metal'} is a watertight solid metal (0% optical transmittance). No internal light can penetrate opaque walls. Switch to SLA Optical Clear Resins in Step 1 to preview the internal glowing effect in the 3D viewer.
                      </p>
                    </div>
                  </div>
                )}

                {/* Interactive Light Location Coordinates (X, Y, Z in mm) */}
                {((machining.illumination && machining.illumination !== 'none') || currentMaterial?.is_transparent) && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5 mt-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        Light Origin Coordinates (mm):
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        Drag in 3D viewer or adjust below
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono">
                      {/* X Input */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center">
                        <span className="text-[9px] text-rose-400 font-bold block">X (Width)</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <input
                            type="number"
                            step="0.5"
                            value={lightCoords?.x ?? 0}
                            onChange={(e) => onLightCoordsChange && onLightCoordsChange({ ...(lightCoords || { x: 0, y: 25, z: 0 }), x: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center font-bold text-white text-xs focus:outline-none focus:border-rose-400"
                          />
                          <span className="text-[10px] text-slate-500">mm</span>
                        </div>
                      </div>

                      {/* Y Input */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center">
                        <span className="text-[9px] text-emerald-400 font-bold block">Y (Height)</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <input
                            type="number"
                            step="0.5"
                            value={lightCoords?.y ?? 25}
                            onChange={(e) => onLightCoordsChange && onLightCoordsChange({ ...(lightCoords || { x: 0, y: 25, z: 0 }), y: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <span className="text-[10px] text-slate-500">mm</span>
                        </div>
                      </div>

                      {/* Z Input */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center">
                        <span className="text-[9px] text-cyan-400 font-bold block">Z (Depth)</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <input
                            type="number"
                            step="0.5"
                            value={lightCoords?.z ?? 0}
                            onChange={(e) => onLightCoordsChange && onLightCoordsChange({ ...(lightCoords || { x: 0, y: 25, z: 0 }), z: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center font-bold text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                          <span className="text-[10px] text-slate-500">mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4C: Custom Laser-Engraved Identification Plaque */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-slate-200">Custom Laser-Etched Plaque</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60">+$35</span>
                </div>
                <p className="text-[11px] text-slate-400">Laser engrave serial number, project title, or custom dedication plaque.</p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="e.g. SN-2026-TITAN-001"
                  value={machining.custom_engraving || ''}
                  onChange={(e) => setMachining((m) => ({ ...m, custom_engraving: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Batch Quantity, Schedule & Instant Quote Summary */}
      <div id="quote-section-5" className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl shadow-2xl transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(5)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">5. Batch Quantity, Schedule & Instant Quote</h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                <span className="text-white font-mono font-semibold">{quantity} pcs</span>
                <span className="text-slate-500 mx-1.5">•</span>
                <span className="text-slate-300 font-mono">
                  {selectedLeadTime === 'standard' ? 'Standard (5-7d)' : selectedLeadTime === 'expedited' ? 'Expedited (3-4d)' : 'Rush (24-48h)'}
                </span>
                {quote && (
                  <>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-cyan-400 font-mono font-bold">${quote.total_price.toFixed(2)} Total</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {quote && (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden sm:inline">
                ${quote.total_price.toFixed(2)}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 flex items-center gap-1">
              <span className="hidden sm:inline">{expandedSections[5] ? 'Collapse' : 'Review & Order'}</span>
              {expandedSections[5] ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-300" />
              )}
            </span>
          </div>
        </button>

        {expandedSections[5] && (
          <div className="p-6 pt-3 border-t border-slate-800 space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Production Batch Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 bg-transparent text-center font-mono font-bold text-white text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {quantity > 10 ? 'Volume Discount (-15%) Applied' : 'Standard Tier'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Production Lead Time</label>
                <div className="flex items-center gap-2">
                  {leadTimes.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setSelectedLeadTime(lt.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selectedLeadTime === lt.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>{lt.name.split(' ')[0]}</div>
                      <div className="text-[10px] opacity-75 font-mono">
                        {lt.id === 'standard' ? 'Standard' : lt.id === 'expedited' ? '+25%' : '+60%'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Price Breakdown */}
            {quote ? (
              <div className="space-y-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Base Additive Printing ({technology.toUpperCase()} Material & Laser)</span>
                    <span className="font-mono text-slate-200">${quote.breakdown.material_cost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Machine Envelope Build Time</span>
                    <span className="font-mono text-slate-200">${quote.breakdown.machine_cost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Selected Surface Finishing ({currentFinish?.name})</span>
                    <span className="font-mono text-slate-200">${quote.breakdown.finish_cost?.toFixed(2)}</span>
                  </div>
                  {quote.breakdown.machining_cost > 0 && (
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Secondary Ops & Curing / Heat Treatment</span>
                      <span className="font-mono text-amber-300">+${quote.breakdown.machining_cost?.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.breakdown.display_cost > 0 && (
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Showcase Hardware (Bases, Mag-Lev, Illumination)</span>
                      <span className="font-mono text-indigo-300">+${quote.breakdown.display_cost?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Expedited Dispatch & Logistics</span>
                    <span className="font-mono text-slate-200">${quote.breakdown.shipping_cost?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-semibold text-white block">Total Instant Quote</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ${(quote.total_price / quantity).toFixed(2)} / unit • {quantity} pcs
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-cyan-400">
                        ${quote.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* IP Clickwrap Compliance Indicator */}
                <div className="flex items-center justify-between text-[11px] font-mono px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className={`w-3.5 h-3.5 ${ipTermsAccepted ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>IP & Legal Gate (v{legalDisclaimer?.version || '1.0'}):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-1 flex items-center gap-1 cursor-pointer"
                  >
                    {ipTermsAccepted ? (
                      <span className="text-emerald-400 font-bold">✓ Certified & Accepted</span>
                    ) : (
                      <span>Mandatory Clickwrap Gate</span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Proceed to Production Checkout
                  </button>
                  {onSaveProjectClick && (
                    <button
                      type="button"
                      onClick={onSaveProjectClick}
                      className="px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Save this quote configuration as a Project"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  )}
                </div>
              </div>
            ) : isCalculating ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Computing volumetric exposure and post-processing pricing...
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Order Confirmation & Dispatch
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct dispatch to TitanForge industrial additive fleet
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'WALLET'
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Digital Wallet</div>
                    <div className="text-[11px] font-mono mt-1 text-slate-400">
                      Balance: <strong className="text-emerald-400">${walletBalance.toFixed(2)}</strong>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Corporate Credit Card</div>
                    <div className="text-[11px] font-mono mt-1 text-slate-400">Visa / Amex / PO</div>
                  </button>
                </div>
              </div>

              {/* Shipping Address Inputs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  Courier Shipping Destination
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Recipient Full Name / Engineering Lead"
                    value={shippingAddress.full_name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street Address, Bay #, or Laboratory Bldg"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State / Province"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="ZIP / Postal"
                      value={shippingAddress.zip_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Technology Fleet</span>
                  <span className="text-white font-mono">{TECHNOLOGIES.find(t => t.id === technology)?.shortName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Component Material</span>
                  <span className="text-white font-mono">{currentMaterial?.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Surface Finish</span>
                  <span className="text-white font-mono">{currentFinish?.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantity & Schedule</span>
                  <span className="text-white font-mono">{quantity} pcs • {selectedLeadTime.toUpperCase()}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-white">Total Amount Due</span>
                  <span className="font-mono text-cyan-400">${quote?.total_price.toFixed(2)}</span>
                </div>
              </div>

              {/* Mandatory Clickwrap IP & Legal Disclaimer Gate */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  ipTermsAccepted
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : 'bg-amber-950/25 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id="checkout-ip-terms-checkbox"
                      checked={ipTermsAccepted}
                      onChange={(e) => setIpTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <label
                      htmlFor="checkout-ip-terms-checkbox"
                      className="text-xs font-medium text-slate-200 cursor-pointer block leading-relaxed select-none"
                    >
                      {legalDisclaimer?.checkboxText ||
                        legalDisclaimer?.checkbox_text ||
                        "I certify that I own the intellectual property rights or hold explicit authorization to manufacture the uploaded 3D model(s), that these files contain no prohibited/regulated items, and I agree to the IP & Indemnification Terms."}
                    </label>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[11px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review Full IP & Indemnification Terms (v{legalDisclaimer?.version || '1.0'})</span>
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        • Mandatory Legal Clickwrap Gate
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPlacingOrder || !ipTermsAccepted}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !ipTermsAccepted
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-98'
                  }`}
                  title={!ipTermsAccepted ? "Mandatory: Check the IP ownership & indemnification checkbox to proceed" : "Authorize and dispatch to additive fleet"}
                >
                  {isPlacingOrder ? (
                    'Transmitting to Machines...'
                  ) : !ipTermsAccepted ? (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Check IP Agreement to Proceed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      Authorize & Start Production
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full IP & Legal Disclaimer Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">
                      {legalDisclaimer?.title || "Intellectual Property & Legal Manufacturing Terms"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      v{legalDisclaimer?.version || '1.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mandatory Clickwrap Gate • Applicable to All Additive Production
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Disclaimer Content Viewer */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300/90 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Legal Notice: As an on-demand contract manufacturer, TitanForge requires affirmative legal certification of IP ownership and indemnification.
                </span>
              </div>

              {/* Render Full Terms (supporting Markdown paragraphs & headers) */}
              <div className="space-y-4 whitespace-pre-wrap font-sans text-xs bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 leading-relaxed select-text">
                {legalDisclaimer?.fullTermsContent || legalDisclaimer?.full_terms_content || (
                  <p className="text-slate-400 italic">No legal terms configured.</p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Clicking accept confirms your legal authority to manufacture this design.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIpTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>I Certify & Agree to Terms</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
