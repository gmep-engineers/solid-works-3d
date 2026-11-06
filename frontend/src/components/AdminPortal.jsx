import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  ShieldAlert,
  BarChart3,
  Layers,
  Wrench,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  EyeOff,
  Edit3,
  Filter,
  Users,
  RefreshCw,
  Cpu,
  AlertTriangle,
  PlusCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Flame,
  Save,
  Trash2,
  Landmark,
  CreditCard,
  Building2,
  ShieldCheck,
  ArrowUpRight,
  DollarSign,
  Sliders,
  Check,
  X,
  Tag,
  Zap,
  Lightbulb,
  Box,
  FileCheck,
  Lock,
  Database,
  Hash,
  HardDrive,
  Link2,
  Key,
  Download,
  ExternalLink
} from 'lucide-react';

export const AVAILABLE_POST_PROCESSING = [
  { id: 'as_printed', name: 'Glass Bead Blasting', category: 'Surface Finish', desc: 'Satin matte finish, removes residual sintered powder.' },
  { id: 'vibratory_tumble', name: 'Vibratory Tumble Polish', category: 'Surface Finish', desc: 'Ceramic media deburring and surface smoothing.' },
  { id: 'electrochemical', name: 'Electro-Chemical Polish', category: 'Surface Finish', desc: 'Ra 1.2-2.0 µm micro-cleaned electrolytic bath.' },
  { id: 'mirror_polish', name: 'Optical Mirror Hand Polish', category: 'Surface Finish', desc: 'Progressive diamond lapping to specular mirror reflectance.' },
  { id: 'optical_diamond_coat', name: 'Optical UV Clearcoat & Dip', category: 'Optical & Resin', desc: 'UV lacquer dip & diamond buffing for 92% optical clarity.' },
  { id: 'frosted_matte_diffusion', name: 'Frosted Matte Light Diffusion', category: 'Optical & Resin', desc: 'Soft photon-scattering treatment for anti-glare diffusers.' },
  { id: 'vapor_smoothing', name: 'Chemical Vapor Smoothing', category: 'Optical & Resin', desc: 'Solvent vapor circulation for sealed, glossy, injection-molded feel.' },
  { id: 'dyeing_tinting', name: 'Pigment Dyeing & Tinting', category: 'Optical & Resin', desc: 'Deep saturation dye bath for uniform custom translucent colors.' },
  { id: 'uv_cure_wash', name: 'Ultrasonic Wash & Multi-Axis UV Cure', category: 'Optical & Resin', desc: 'Automated IPA rinse and temperature-controlled UV cure.' },
  { id: 'stress_relief', name: 'Vacuum Thermal Stress Relief', category: 'Metallurgical', desc: 'Argon vacuum furnace cycle preventing part warpage.' },
  { id: 'hip', name: 'Hot Isostatic Pressing (HIP)', category: 'Metallurgical', desc: '1020°C @ 100 MPa argon to eliminate micro-porosity to 99.9%.' },
  { id: 'solution_aging', name: 'Solution Anneal & Aging', category: 'Metallurgical', desc: 'Crystalline microstructure optimization for maximum yield.' }
];

export const AVAILABLE_ADDONS = [
  { id: 'hole_threading', name: 'CNC Thread Tapping & Inserts', category: 'Subtractive CNC', desc: 'M3-M12 & 1/4-20 calibrated thread tapping.' },
  { id: 'datum_face_milling', name: 'Datum Face Precision Milling', category: 'Subtractive CNC', desc: 'High-speed CNC face milling to <0.02 mm flatness.' },
  { id: 'precision_reaming', name: 'H7 Precision Bore Reaming', category: 'Subtractive CNC', desc: 'H7 ISO dowel pin and bearing location bores.' },
  { id: 'wire_edm_cutoff', name: 'Submerged Wire EDM Plate Cut-Off', category: 'Subtractive CNC', desc: 'Zero-stress separation from build plate without residual stubs.' },
  { id: 'warm_edison_2700k', name: 'Warm Edison 2700K Luminaire Core', category: 'Custom Light', desc: 'High-CRI 95+ warm LED core for custom transparent lamps.' },
  { id: 'architectural_4000k', name: '4000K Pure Neutral Architectural Core', category: 'Custom Light', desc: 'Crisp studio neutral white LED core for optical fixtures.' },
  { id: 'smart_rgbw_touch', name: 'Smart RGBW Touch Dimmer Luminaire Engine', category: 'Custom Light', desc: 'Capacitive touch dimming and 16M color dynamic app control.' },
  { id: 'rechargeable_li_ion', name: '3000mAh USB-C Rechargeable Battery Pack', category: 'Custom Light', desc: 'Integrated Li-ion battery with internal charge controller.' },
  { id: 'mag_levitation', name: 'Anti-Gravity Magnetic Floating Base', category: 'Exhibition', desc: 'Active electromagnetic suspension for silent 360° mid-air floating.' },
  { id: 'laser_engraved_plaque', name: 'Custom Fiber Laser-Engraved Plaque', category: 'Exhibition', desc: 'Etched titanium/brass plaque with custom serial or dedication.' },
  { id: 'express_production', name: 'Critical Emergency Express (2-3 Days)', category: 'Logistics', desc: 'Priority build queue and expedited overnight courier shipping.' }
];

const ORDER_STAGES = [
  { key: 'SUBMITTED', label: '1. Order Submitted' },
  { key: 'DFM_APPROVED', label: '2. DFM & Slicing Approved' },
  { key: 'PRINTING', label: '3. Laser Powder Bed Fusion (Printing)' },
  { key: 'HEAT_TREATMENT', label: '4. Vacuum Furnace Stress Relief & HIP' },
  { key: 'SECONDARY_MACHINING', label: '5. CNC Machining & Threading' },
  { key: 'QUALITY_INSPECTION', label: '6. CMM & Surface Roughness Scan' },
  { key: 'SHIPPED', label: '7. Shipped / In Transit' },
  { key: 'DELIVERED', label: '8. Delivered to Recipient' }
];

export default function AdminPortal({ onInspectModel, initialTab = 'orders' }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [postProcessingList, setPostProcessingList] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab); // 'orders' | 'materials' | 'machines' | 'postproc' | 'addons' | 'services' | 'users' | 'bank'
  const [isLoading, setIsLoading] = useState(false);

  // Post-Processing Techniques Management State
  const [editingPostProc, setEditingPostProc] = useState(null);
  const [isPostProcModalOpen, setIsPostProcModalOpen] = useState(false);
  const [postProcSearchQuery, setPostProcSearchQuery] = useState('');
  const [postProcCategoryFilter, setPostProcCategoryFilter] = useState('ALL');
  const [postProcStatusFilter, setPostProcStatusFilter] = useState('ALL');
  const [postProcForm, setPostProcForm] = useState({
    id: '',
    name: '',
    category: 'Surface Finish',
    description: '',
    lead_time_days: 1,
    pricing_model: 'per_part',
    base_price: 25.0,
    compatible_material_ids: [],
    is_active: true
  });

  // Product Add-On Features Management State
  const [editingAddon, setEditingAddon] = useState(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [addonSearchQuery, setAddonSearchQuery] = useState('');
  const [addonCategoryFilter, setAddonCategoryFilter] = useState('ALL');
  const [addonStatusFilter, setAddonStatusFilter] = useState('ALL');
  const [addonForm, setAddonForm] = useState({
    id: '',
    name: '',
    category: 'Subtractive CNC',
    description: '',
    lead_time_days: 1,
    pricing_model: 'per_part',
    base_price: 25.0,
    compatible_material_ids: [],
    is_active: true
  });

  // Merchant Bank & Payment Gateway Setup State
  const [bankConfig, setBankConfig] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [isTriggeringPayout, setIsTriggeringPayout] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');
  const [bankErrorMsg, setBankErrorMsg] = useState('');
  const [bankForm, setBankForm] = useState({
    bank_name: 'JPMorgan Chase Commercial Bank',
    account_holder: 'TitanForge Additive Manufacturing LLC',
    routing_number: '021000021',
    account_number: '',
    account_type: 'business_checking',
    gateway_provider: 'Stripe Additive Gateway',
    merchant_id: 'acct_1N9472918840',
    api_key: '',
    currency: 'USD',
    payout_schedule: 'daily_rolling'
  });

  // Status Update Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [technicianNote, setTechnicianNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('FedEx Priority Freight');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Material Modal State
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    id: '',
    name: '',
    density_g_cm3: 4.43,
    raw_cost_per_g: 0.15,
    laser_rate_cm3_hr: 20.0,
    machine_hourly_rate: 95.0,
    min_wall_recommended_mm: 0.8,
    color_hex: '#94a3b8',
    description: '',
    is_active: true,
    optical_type: 'OPAQUE',
    transmission_factor: 0.0
  });

  // Service Modal State
  const [editingService, setEditingService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    category: 'cnc_operation',
    name: '',
    base_price: 25.0,
    unit: 'per_part',
    spec_detail: '',
    description: '',
    is_active: true
  });

  // Machine Fleet, DFM Limits & Relational Mapping State
  const [machines, setMachines] = useState([]);
  const [editingMachine, setEditingMachine] = useState(null);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [machineModalTab, setMachineModalTab] = useState('specs'); // 'specs' | 'materials' | 'postproc' | 'addons'
  const [machineSearchQuery, setMachineSearchQuery] = useState('');
  const [machineTechFilter, setMachineTechFilter] = useState('ALL');
  const [machineStatusFilter, setMachineStatusFilter] = useState('ALL');
  const [materialSearchInModal, setMaterialSearchInModal] = useState('');
  const [isSavingMachine, setIsSavingMachine] = useState(false);
  const [machineSaveFeedback, setMachineSaveFeedback] = useState('');

  const [machineForm, setMachineForm] = useState({
    id: '',
    name: '',
    manufacturer: '',
    technology: 'DMLS (Direct Metal Laser Sintering)',
    status: 'ACTIVE',
    build_volume_x_mm: 250.0,
    build_volume_y_mm: 250.0,
    build_volume_z_mm: 325.0,
    min_supported_wall_mm: 0.40,
    min_unsupported_wall_mm: 0.80,
    max_wall_thickness_mm: 80.0,
    min_hole_diameter_mm: 0.50,
    min_pin_diameter_mm: 0.30,
    laser_power_watts: 400,
    laser_spot_diameter_um: 100,
    min_layer_thickness_um: 20,
    max_layer_thickness_um: 60,
    hourly_rate: 95.0,
    supported_materials: [],
    supported_post_processing: [],
    supported_addons: [],
    description: '',
    is_active: true
  });

  // Legal & IP Disclaimer State
  const [disclaimer, setDisclaimer] = useState({
    id: 'default_ip_disclaimer',
    title: 'Intellectual Property & Legal Manufacturing Terms',
    checkboxText: 'I certify that I own the intellectual property rights or hold explicit authorization to manufacture the uploaded 3D model(s), that these files contain no prohibited/regulated items, and I agree to the IP & Indemnification Terms.',
    fullTermsContent: '',
    version: '1.0',
    wormRetentionYears: 7,
    cadRetentionDays: 90,
    isActive: true,
    updatedAt: ''
  });
  const [isSavingDisclaimer, setIsSavingDisclaimer] = useState(false);
  const [disclaimerFeedback, setDisclaimerFeedback] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [simulatedCheckbox, setSimulatedCheckbox] = useState(false);

  // WORM Ledger & Cryptographic Storage State
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedLedgerBlock, setSelectedLedgerBlock] = useState(null);
  const [merkleResult, setMerkleResult] = useState(null);
  const [isVerifyingMerkle, setIsVerifyingMerkle] = useState(false);
  const [storageConfig, setStorageConfig] = useState({
    provider_type: 'LOCAL_WORM_VAULT',
    s3_bucket: '',
    s3_region: 'us-east-1',
    s3_access_key: '',
    s3_secret_key: '',
    retention_mode: 'COMPLIANCE',
    is_active: true
  });
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState(null);
  const [storageSaveFeedback, setStorageSaveFeedback] = useState('');
  const [legalHoldModalBlock, setLegalHoldModalBlock] = useState(null);
  const [legalHoldReason, setLegalHoldReason] = useState('');
  const [isEnactingHold, setIsEnactingHold] = useState(false);

  // TitanForge 3D & Tripo3D API Billing State
  const [titanForgeConfig, setTitanForgeConfig] = useState({
    id: 'TRIPO_3D',
    provider: 'TRIPO_3D',
    apiKey: '',
    apiKeyMasked: '',
    hasKey: false,
    baseUrl: 'https://api.tripo3d.ai/v2/openapi',
    isEnabled: true,
    feeStructure: {
      textTo3dDraftCost: 0.50,
      imageTo3dDraftCost: 0.60,
      meshRefinementCost: 0.75,
      pbrTextureCost: 0.75,
      formatConversionCost: 0.25,
      platformMarkupPercent: 25.0
    },
    balanceCredits: 0.0,
    lastCheckedAt: null
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingTitanForge, setIsSavingTitanForge] = useState(false);
  const [titanForgeFeedback, setTitanForgeFeedback] = useState('');
  const [isTestingTripo, setIsTestingTripo] = useState(false);
  const [tripoTestResult, setTripoTestResult] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, ordersData, usersData, materialsData, servicesData, bankData, payoutsData, machinesData, postProcData, addonsData, disclaimerData, ledgerData, storageData, tfData] = await Promise.all([
        api.getDashboardStats(),
        api.getAllOrders(statusFilter === 'ALL' ? null : statusFilter),
        api.getUsersList(),
        api.adminGetMaterials(),
        api.adminGetServices(),
        api.adminGetBankConfig().catch(() => null),
        api.adminGetPayouts().catch(() => []),
        api.adminGetMachines().catch(() => []),
        api.adminGetPostProcessing().catch(() => []),
        api.adminGetAddons().catch(() => []),
        api.adminGetDisclaimer().catch(() => null),
        api.getWormLedger().catch(() => []),
        api.getStorageConfig().catch(() => null),
        api.adminGetTitanForgeConfig().catch(() => null)
      ]);
      setStats(statsData);
      setOrders(ordersData);
      setUsersList(usersData);
      setMaterials(materialsData);
      setServices(servicesData);
      if (machinesData) setMachines(machinesData);
      if (postProcData) setPostProcessingList(postProcData);
      if (addonsData) setAddonsList(addonsData);
      if (ledgerData) setLedgerEntries(ledgerData);
      if (storageData) {
        setStorageConfig(storageData);
      }
      if (tfData) {
        setTitanForgeConfig((prev) => ({
          ...prev,
          ...tfData
        }));
      }
      if (disclaimerData) {
        setDisclaimer({
          id: disclaimerData.id || 'default_ip_disclaimer',
          title: disclaimerData.title || 'Intellectual Property & Legal Manufacturing Terms',
          checkboxText: disclaimerData.checkboxText || disclaimerData.checkbox_text || '',
          fullTermsContent: disclaimerData.fullTermsContent || disclaimerData.full_terms_content || '',
          version: disclaimerData.version || '1.0',
          isActive: disclaimerData.isActive !== undefined ? disclaimerData.isActive : true,
          updatedAt: disclaimerData.updatedAt || disclaimerData.updated_at || ''
        });
      }
      if (bankData) {
        setBankConfig(bankData);
        setBankForm((prev) => ({
          ...prev,
          bank_name: bankData.bank_name || '',
          account_holder: bankData.account_holder || '',
          routing_number: bankData.routing_number || '',
          account_type: bankData.account_type || 'business_checking',
          gateway_provider: bankData.gateway_provider || 'Stripe Additive Gateway',
          merchant_id: bankData.merchant_id || '',
          currency: bankData.currency || 'USD',
          payout_schedule: bankData.payout_schedule || 'daily_rolling'
        }));
      }
      if (payoutsData) {
        setPayouts(payoutsData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDisclaimer = async (e) => {
    if (e) e.preventDefault();
    setIsSavingDisclaimer(true);
    setDisclaimerFeedback('');
    try {
      const res = await api.adminUpdateDisclaimer({
        title: disclaimer.title,
        checkboxText: disclaimer.checkboxText,
        fullTermsContent: disclaimer.fullTermsContent,
        version: disclaimer.version,
        wormRetentionYears: parseInt(disclaimer.wormRetentionYears || 7),
        cadRetentionDays: parseInt(disclaimer.cadRetentionDays || 90),
        isActive: disclaimer.isActive,
        id: disclaimer.id
      });
      if (res.disclaimer) {
        setDisclaimer({
          id: res.disclaimer.id || disclaimer.id,
          title: res.disclaimer.title || disclaimer.title,
          checkboxText: res.disclaimer.checkboxText || res.disclaimer.checkbox_text || disclaimer.checkboxText,
          fullTermsContent: res.disclaimer.fullTermsContent || res.disclaimer.full_terms_content || disclaimer.fullTermsContent,
          version: res.disclaimer.version || disclaimer.version,
          wormRetentionYears: res.disclaimer.wormRetentionYears || disclaimer.wormRetentionYears || 7,
          cadRetentionDays: res.disclaimer.cadRetentionDays || disclaimer.cadRetentionDays || 90,
          isActive: res.disclaimer.isActive !== undefined ? res.disclaimer.isActive : true,
          updatedAt: res.disclaimer.updatedAt || res.disclaimer.updated_at || new Date().toISOString()
        });
      }
      setDisclaimerFeedback('Terms & IP disclaimer successfully saved and deployed live!');
      setTimeout(() => setDisclaimerFeedback(''), 4000);
    } catch (err) {
      console.error('Save disclaimer error:', err);
      setDisclaimerFeedback(`Error: ${err.message}`);
    } finally {
      setIsSavingDisclaimer(false);
    }
  };

  const handleVerifyMerkleChain = async () => {
    setIsVerifyingMerkle(true);
    try {
      const res = await api.verifyMerkleChain();
      setMerkleResult(res);
    } catch (err) {
      setMerkleResult({ is_valid: false, message: err.message });
    } finally {
      setIsVerifyingMerkle(false);
    }
  };

  const handleTestStorage = async () => {
    setIsTestingStorage(true);
    setStorageTestResult(null);
    try {
      const res = await api.testStorageConnection();
      setStorageTestResult(res);
    } catch (err) {
      setStorageTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingStorage(false);
    }
  };

  const handleSaveStorageConfig = async (e) => {
    if (e) e.preventDefault();
    setStorageSaveFeedback('');
    try {
      const res = await api.updateStorageConfig(storageConfig);
      if (res.config) {
        setStorageConfig(res.config);
      }
      setStorageSaveFeedback('WORM storage configuration successfully updated.');
      setTimeout(() => setStorageSaveFeedback(''), 4000);
    } catch (err) {
      setStorageSaveFeedback(`Error: ${err.message}`);
    }
  };

  const handleSaveTitanForgeConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingTitanForge(true);
    setTitanForgeFeedback('');
    try {
      const res = await api.adminUpdateTitanForgeConfig({
        apiKey: titanForgeConfig.apiKey || undefined,
        baseUrl: titanForgeConfig.baseUrl,
        isEnabled: titanForgeConfig.isEnabled,
        feeStructure: titanForgeConfig.feeStructure
      });
      if (res.config) {
        setTitanForgeConfig((prev) => ({
          ...prev,
          ...res.config,
          apiKey: ''
        }));
      }
      setTitanForgeFeedback('TitanForge 3D & Tripo3D API billing settings successfully deployed live!');
      setTimeout(() => setTitanForgeFeedback(''), 4500);
    } catch (err) {
      setTitanForgeFeedback(`Error: ${err.message}`);
    } finally {
      setIsSavingTitanForge(false);
    }
  };

  const handleTestTripoConnection = async () => {
    setIsTestingTripo(true);
    setTripoTestResult(null);
    try {
      const res = await api.adminTestTripoConnection();
      setTripoTestResult(res);
      if (res.balance_credits !== undefined) {
        setTitanForgeConfig((prev) => ({
          ...prev,
          balanceCredits: res.balance_credits,
          lastCheckedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      setTripoTestResult({
        success: false,
        message: `Connection failed: ${err.message}`
      });
    } finally {
      setIsTestingTripo(false);
    }
  };

  const handleEnactLegalHold = async () => {
    if (!legalHoldModalBlock) return;
    setIsEnactingHold(true);
    try {
      await api.toggleLegalHold(legalHoldModalBlock.id, legalHoldReason);
      setLegalHoldModalBlock(null);
      setLegalHoldReason('');
      loadData();
    } catch (err) {
      alert(`Legal hold error: ${err.message}`);
    } finally {
      setIsEnactingHold(false);
    }
  };

  const handleResetDisclaimerDefaults = () => {
    if (window.confirm("Reset all terms and checkbox text to standard TitanForge default legal clauses?")) {
      setDisclaimer((prev) => ({
        ...prev,
        title: "Intellectual Property & Legal Manufacturing Terms",
        version: "1.0",
        checkboxText: "I certify that I own the intellectual property rights or hold explicit authorization to manufacture the uploaded 3D model(s), that these files contain no prohibited/regulated items, and I agree to the IP & Indemnification Terms.",
        fullTermsContent: `# TitanForge Additive Manufacturing — Intellectual Property & Legal Manufacturing Terms

**Document Version:** 1.0  
**Effective Date:** Mandatory Clickwrap Gate  
**Applicability:** Applies strictly to all uploaded CAD models, 3D tessellations, drawings, and physical manufacturing orders dispatched through the TitanForge quoting engine.

---

### 1. Intellectual Property Ownership & Customer Warranties
The Customer expressly certifies, warrants, and represents to TitanForge 3D and its manufacturing affiliates that:
* **Sole Ownership or Explicit License:** Customer is either the sole, exclusive, and unencumbered legal owner of all proprietary rights, trade secrets, patents, copyrights, and industrial design rights in and to the uploaded 3D CAD model(s); OR Customer holds a valid, fully executed, written license or authorization from the legal rights-holder granting explicit permission to manufacture, reproduce, machine, and post-process physical components based on the uploaded geometry.
* **Non-Infringement Warranty:** The production, machining, surface finishing, assembly, delivery, or sale of components generated from the uploaded designs will not infringe upon, misappropriate, dilute, or violate any patent, copyright, trademark, trade secret, mask work, or contractual right of any third party worldwide.

---

### 2. Defense, Indemnification & Hold Harmless
* **Comprehensive Customer Indemnification:** Customer agrees to defend, indemnify, and hold harmless TitanForge 3D, its corporate parents, subsidiaries, affiliates, officers, directors, employees, laser sintering technicians, and logistics partners from and against any and all claims, demands, liabilities, lawsuits, judgments, losses, damages, government penalties, costs, and expenses (including reasonable attorneys' fees and expert witness costs) arising out of or related to:
  * Any allegation or formal claim that the uploaded 3D geometry, CAD files, or physical parts produced therefrom infringe upon or violate third-party intellectual property or proprietary rights.
  * Any breach or alleged breach of Customer’s warranties, regulatory declarations, or representations contained in these terms.
* **Assumption of Defense:** TitanForge reserves the right, at its own option, to assume exclusive defense and control of any matter subject to indemnification by Customer, and Customer agrees to cooperate fully with TitanForge in asserting any available defenses.

---

### 3. Prohibited Designs & Regulatory Compliance
TitanForge enforces a strict zero-tolerance policy regarding illegal, hazardous, and regulated articles. You strictly certify that the uploaded files DO NOT contain, embody, or facilitate:
* **Firearms & Restricted Weaponry:** Complete firearms, receivers, frames, silencer/suppressor baffles, conversion devices (e.g., auto-sears), or any components regulated under the National Firearms Act (NFA) or Undetectable Firearms Act.
* **Defense Articles & Export Control (ITAR/EAR):** Technical data or defense articles restricted under U.S. International Traffic in Arms Regulations (ITAR) or Export Administration Regulations (EAR), unless explicitly disclosed and approved under an authorized ITAR manufacturing agreement.
* **Hazardous & Prohibited Contraband:** Biohazard dispersion mechanisms, controlled substance extraction vessels, illegal lock-picking or intrusion mechanisms, or items specifically engineered to inflict unlawful bodily harm.

---

### 4. Right to Refuse Service, Cancel Orders & Purge Files
* **On-Demand Contract Manufacturer Status:** TitanForge acts solely as an independent, on-demand contract manufacturer and automated geometry analysis provider. TitanForge does not verify design utility, fitness for a particular purpose, or freedom-to-operate.
* **Absolute Right to Cancel & Purge:** TitanForge reserves the absolute right, exercisable at any time in its sole discretion and without liability, to cancel orders, suspend automated slicing or laser powder bed fusion builds, notify law enforcement or regulatory authorities if prohibited items are identified, and immediately purge CAD models and associated data from all storage systems.

---

### 5. Customer IP Confidentiality & Non-Disclosure
* **Confidential Manufacturing Standard:** TitanForge treats all uploaded customer 3D CAD geometries, tessellated files (STL, OBJ, STEP), engineering drawings, and manufacturing specifications as strictly confidential Customer Proprietary Information.
* **Non-Disclosure & Anti-Derivative Guarantee:** TitanForge guarantees that customer CAD models and proprietary designs are utilized solely and exclusively to perform automated geometric DFM slicing, quotation calculation, laser path generation, and physical part manufacturing. TitanForge will never share, sell, distribute, display publicly, reverse engineer, or incorporate customer designs into derivative products or open machine learning training sets.`
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Order Stage Handlers
  const handleOpenStatusModal = (order) => {
    setEditingOrder(order);
    setUpdateStatus(order.status);
    setTechnicianNote('');
    setTrackingNumber(order.tracking_number || '');
    setCarrier(order.carrier || 'FedEx Priority Freight');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsSubmitting(true);
    try {
      await api.updateOrderStatus(editingOrder.id, {
        status: updateStatus,
        note: technicianNote,
        tracking_number: trackingNumber,
        carrier: carrier
      });
      setIsSubmitting(false);
      setEditingOrder(null);
      loadData();
    } catch (err) {
      alert(`Error updating order: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Material Handlers
  const handleOpenAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm({
      id: '',
      name: '',
      density_g_cm3: 4.43,
      raw_cost_per_g: 0.15,
      laser_rate_cm3_hr: 20.0,
      machine_hourly_rate: 95.0,
      min_wall_recommended_mm: 0.8,
      color_hex: '#94a3b8',
      description: '',
      is_active: true,
      optical_type: 'OPAQUE',
      transmission_factor: 0.0
    });
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (mat) => {
    setEditingMaterial(mat);
    setMaterialForm({
      ...mat,
      is_active: Boolean(mat.is_active),
      optical_type: mat.optical_type || mat.opticalType || 'OPAQUE',
      transmission_factor: mat.transmission_factor !== undefined ? mat.transmission_factor : (mat.transmissionFactor || 0.0)
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await api.adminUpdateMaterial(editingMaterial.id, materialForm);
      } else {
        await api.adminCreateMaterial(materialForm);
      }
      setIsMaterialModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error saving material: ${err.message}`);
    }
  };

  const handleToggleMaterial = async (matId) => {
    try {
      await api.adminToggleMaterial(matId);
      loadData();
    } catch (err) {
      alert(`Error toggling material: ${err.message}`);
    }
  };

  // Machining Service Handlers
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      id: '',
      category: 'cnc_operation',
      name: '',
      base_price: 25.0,
      unit: 'per_part',
      spec_detail: '',
      description: '',
      is_active: true
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (svc) => {
    setEditingService(svc);
    setServiceForm({
      ...svc,
      is_active: Boolean(svc.is_active)
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.adminUpdateService(editingService.id, serviceForm);
      } else {
        await api.adminCreateService(serviceForm);
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleToggleService = async (svcId) => {
    try {
      await api.adminToggleService(svcId);
      loadData();
    } catch (err) {
      alert(`Error toggling service: ${err.message}`);
    }
  };

  // Post-Processing Techniques Handlers
  const handleOpenAddPostProc = () => {
    setEditingPostProc(null);
    setPostProcForm({
      id: '',
      name: '',
      category: 'Surface Finish',
      description: '',
      lead_time_days: 1,
      pricing_model: 'per_part',
      base_price: 25.0,
      compatible_material_ids: [],
      is_active: true
    });
    setIsPostProcModalOpen(true);
  };

  const handleOpenEditPostProc = (p) => {
    setEditingPostProc(p);
    setPostProcForm({
      ...p,
      lead_time_days: p.lead_time_days || 1,
      pricing_model: p.pricing_model || 'per_part',
      base_price: p.base_price || 0.0,
      compatible_material_ids: Array.isArray(p.compatible_material_ids) ? p.compatible_material_ids : [],
      is_active: Boolean(p.is_active)
    });
    setIsPostProcModalOpen(true);
  };

  const handleSavePostProc = async (e) => {
    e.preventDefault();
    try {
      if (editingPostProc) {
        await api.adminUpdatePostProcessing(editingPostProc.id, postProcForm);
      } else {
        await api.adminCreatePostProcessing(postProcForm);
      }
      setIsPostProcModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error saving post-processing technique: ${err.message}`);
    }
  };

  const handleTogglePostProc = async (id) => {
    try {
      await api.adminTogglePostProcessing(id);
      loadData();
    } catch (err) {
      alert(`Error toggling post-processing technique: ${err.message}`);
    }
  };

  // Product Add-On Features Handlers
  const handleOpenAddAddon = () => {
    setEditingAddon(null);
    setAddonForm({
      id: '',
      name: '',
      category: 'Subtractive CNC',
      description: '',
      lead_time_days: 1,
      pricing_model: 'per_part',
      base_price: 25.0,
      compatible_material_ids: [],
      is_active: true
    });
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (a) => {
    setEditingAddon(a);
    setAddonForm({
      ...a,
      lead_time_days: a.lead_time_days || 1,
      pricing_model: a.pricing_model || 'per_part',
      base_price: a.base_price || 0.0,
      compatible_material_ids: Array.isArray(a.compatible_material_ids) ? a.compatible_material_ids : [],
      is_active: Boolean(a.is_active)
    });
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e) => {
    e.preventDefault();
    try {
      if (editingAddon) {
        await api.adminUpdateAddon(editingAddon.id, addonForm);
      } else {
        await api.adminCreateAddon(addonForm);
      }
      setIsAddonModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error saving add-on feature: ${err.message}`);
    }
  };

  const handleToggleAddon = async (id) => {
    try {
      await api.adminToggleAddon(id);
      loadData();
    } catch (err) {
      alert(`Error toggling add-on feature: ${err.message}`);
    }
  };

  // Machine Fleet, DFM Limits & Relational Handlers
  const handleOpenAddMachine = () => {
    setEditingMachine(null);
    setMachineForm({
      id: '',
      name: '',
      manufacturer: '',
      technology: 'DMLS (Direct Metal Laser Sintering)',
      status: 'ACTIVE',
      build_volume_x_mm: 250.0,
      build_volume_y_mm: 250.0,
      build_volume_z_mm: 325.0,
      min_supported_wall_mm: 0.40,
      min_unsupported_wall_mm: 0.80,
      max_wall_thickness_mm: 80.0,
      min_hole_diameter_mm: 0.50,
      min_pin_diameter_mm: 0.30,
      laser_power_watts: 400,
      laser_spot_diameter_um: 100,
      min_layer_thickness_um: 20,
      max_layer_thickness_um: 60,
      hourly_rate: 95.0,
      supported_materials: ['ti_6al_4v', 'ss_316l', 'alsi10mg', 'inconel_718'],
      supported_post_processing: ['as_printed', 'vibratory_tumble', 'electrochemical', 'stress_relief', 'hip'],
      supported_addons: ['hole_threading', 'datum_face_milling', 'wire_edm_cutoff', 'laser_engraved_plaque'],
      description: '',
      is_active: true
    });
    setMachineModalTab('specs');
    setMachineSaveFeedback('');
    setIsMachineModalOpen(true);
  };

  const handleOpenEditMachine = (m) => {
    setEditingMachine(m);
    setMachineForm({
      ...m,
      max_wall_thickness_mm: m.max_wall_thickness_mm || 80.0,
      supported_materials: Array.isArray(m.supported_materials) ? m.supported_materials : [],
      supported_post_processing: Array.isArray(m.supported_post_processing) ? m.supported_post_processing : [],
      supported_addons: Array.isArray(m.supported_addons) ? m.supported_addons : [],
      is_active: Boolean(m.is_active)
    });
    setMachineModalTab('specs');
    setMachineSaveFeedback('');
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = async (e) => {
    if (e) e.preventDefault();
    setIsSavingMachine(true);
    setMachineSaveFeedback('');
    try {
      if (editingMachine) {
        await api.adminUpdateMachine(editingMachine.id, machineForm);
      } else {
        await api.adminCreateMachine(machineForm);
      }
      setMachineSaveFeedback('Machine limits, materials & relational mappings successfully saved!');
      await loadData();
      setTimeout(() => {
        setIsMachineModalOpen(false);
        setIsSavingMachine(false);
        setMachineSaveFeedback('');
      }, 1000);
    } catch (err) {
      alert(`Error saving machine: ${err.message}`);
      setIsSavingMachine(false);
    }
  };

  const handleToggleMachine = async (mId) => {
    try {
      await api.adminToggleMachine(mId);
      loadData();
    } catch (err) {
      alert(`Error toggling machine: ${err.message}`);
    }
  };

  const toggleMaterialLink = (matId) => {
    setMachineForm((prev) => {
      const list = Array.isArray(prev.supported_materials) ? prev.supported_materials : [];
      const exists = list.includes(matId);
      return {
        ...prev,
        supported_materials: exists ? list.filter((id) => id !== matId) : [...list, matId]
      };
    });
  };

  const togglePostProcLink = (procId) => {
    setMachineForm((prev) => {
      const list = Array.isArray(prev.supported_post_processing) ? prev.supported_post_processing : [];
      const exists = list.includes(procId);
      return {
        ...prev,
        supported_post_processing: exists ? list.filter((id) => id !== procId) : [...list, procId]
      };
    });
  };

  const toggleAddonLink = (addonId) => {
    setMachineForm((prev) => {
      const list = Array.isArray(prev.supported_addons) ? prev.supported_addons : [];
      const exists = list.includes(addonId);
      return {
        ...prev,
        supported_addons: exists ? list.filter((id) => id !== addonId) : [...list, addonId]
      };
    });
  };

  const handleSelectAllMetals = () => {
    const metalIds = materials.filter((m) => !m.is_transparent).map((m) => m.id);
    setMachineForm((prev) => {
      const cur = Array.isArray(prev.supported_materials) ? prev.supported_materials : [];
      const combined = Array.from(new Set([...cur, ...metalIds]));
      return { ...prev, supported_materials: combined };
    });
  };

  const handleSelectAllResins = () => {
    const resinIds = materials.filter((m) => m.is_transparent).map((m) => m.id);
    setMachineForm((prev) => {
      const cur = Array.isArray(prev.supported_materials) ? prev.supported_materials : [];
      const combined = Array.from(new Set([...cur, ...resinIds]));
      return { ...prev, supported_materials: combined };
    });
  };

  const handleClearAllMaterials = () => {
    setMachineForm((prev) => ({ ...prev, supported_materials: [] }));
  };

  const handleLinkAllPostProc = () => {
    setMachineForm((prev) => ({ ...prev, supported_post_processing: AVAILABLE_POST_PROCESSING.map((p) => p.id) }));
  };

  const handleClearAllPostProc = () => {
    setMachineForm((prev) => ({ ...prev, supported_post_processing: [] }));
  };

  const handleLinkAllAddons = () => {
    setMachineForm((prev) => ({ ...prev, supported_addons: AVAILABLE_ADDONS.map((a) => a.id) }));
  };

  const handleClearAllAddons = () => {
    setMachineForm((prev) => ({ ...prev, supported_addons: [] }));
  };

  // Merchant Bank & Payment Gateway Handlers
  const handleSaveBankConfig = async (e) => {
    e.preventDefault();
    setIsBankSaving(true);
    setBankSuccessMsg('');
    setBankErrorMsg('');
    try {
      const res = await api.adminUpdateBankConfig(bankForm);
      setBankSuccessMsg(res.message || 'Bank and payment gateway configuration updated successfully!');
      setIsBankSaving(false);
      const updated = await api.adminGetBankConfig();
      setBankConfig(updated);
      setBankForm((prev) => ({ ...prev, account_number: '', api_key: '' }));
      setTimeout(() => setBankSuccessMsg(''), 6000);
    } catch (err) {
      setBankErrorMsg(err.message || 'Failed to update bank configuration.');
      setIsBankSaving(false);
    }
  };

  const handleVerifyBank = async () => {
    setIsVerifyingBank(true);
    setBankSuccessMsg('');
    try {
      const res = await api.adminVerifyBank();
      setBankSuccessMsg(res.message);
      const updated = await api.adminGetBankConfig();
      setBankConfig(updated);
      setTimeout(() => setBankSuccessMsg(''), 6000);
    } catch (err) {
      setBankErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleTriggerPayout = async () => {
    setIsTriggeringPayout(true);
    setBankSuccessMsg('');
    try {
      const res = await api.adminTriggerPayout();
      setBankSuccessMsg(res.message);
      const updatedPayouts = await api.adminGetPayouts();
      setPayouts(updatedPayouts);
      setTimeout(() => setBankSuccessMsg(''), 6000);
    } catch (err) {
      setBankErrorMsg(err.message || 'Payout failed.');
    } finally {
      setIsTriggeringPayout(false);
    }
  };

  const handleRefreshLedger = async () => {
    await loadData();
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.user_name.toLowerCase().includes(q) ||
      o.filename.toLowerCase().includes(q) ||
      o.user_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              OPERATIONS CONSOLE
            </span>
            <h2 className="text-xl font-bold text-white">Additive Production & Catalog Admin</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage metal materials, configure secondary CNC & finishing services, process client orders, and setup merchant bank account to receive credit card settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Navigation Pills */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'materials' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'machines' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Machines & Limits ({machines.length})
            </button>
            <button
              onClick={() => setActiveTab('postproc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'postproc' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Post-Processing ({postProcessingList.length})
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'addons' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Add-On Features ({addonsList.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'services' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Machining ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clients ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'bank' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Bank & Payments
            </button>
            <button
              onClick={() => setActiveTab('disclaimer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'disclaimer' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Legal & IP Disclaimer
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'ledger' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              WORM Ledger ({ledgerEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('titanforge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'titanforge' ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              TitanForge 3D & Billing
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Production Queue</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{stats.total_orders}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Orders in system</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Platform Revenue</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              ${stats.total_revenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Settled via wallet & cards</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Available Alloys</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{materials.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active powder inventory</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Machining Services</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{services.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Finishing, CNC, & HIP</div>
          </div>

          <div
            onClick={() => setActiveTab('bank')}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-colors col-span-2 md:col-span-1"
          >
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Merchant Bank</span>
              <Landmark className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {bankConfig?.account_number_masked || '••••8849'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {bankConfig?.bank_name || 'JPMorgan Chase'}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: ORDER OPERATIONS QUEUE ==================== */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl">
              <span className="text-xs font-semibold text-slate-400 shrink-0">Filter Stage:</span>
              {['ALL', 'SUBMITTED', 'DFM_APPROVED', 'PRINTING', 'HEAT_TREATMENT', 'SECONDARY_MACHINING', 'SHIPPED'].map((stg) => (
                <button
                  key={stg}
                  onClick={() => setStatusFilter(stg)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all shrink-0 ${
                    statusFilter === stg
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, clients, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-60"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-3">Order ID / Date</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">CAD Part & Geometry</th>
                  <th className="py-3 px-3">Alloy / Finish</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-cyan-300">{ord.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </div>
                        {ord.ip_terms_accepted ? (
                          <div
                            className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded"
                            title={`IP Terms v${ord.ip_terms_version || '1.0'} accepted at ${ord.ip_terms_accepted_at || 'checkout'}`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>IP Verified v{ord.ip_terms_version || '1.0'}</span>
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{ord.user_name}</div>
                        <div className="text-[11px] text-slate-400">{ord.user_company || ord.user_email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200 truncate max-w-xs" title={ord.filename}>
                          {ord.filename}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {ord.volume_cm3} cm³ • Min Wall: {ord.min_thickness_mm}mm
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{ord.material_name}</div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {ord.quantity} • {ord.finish_type}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-white">
                        ${ord.total_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenStatusModal(ord)}
                          className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/40 transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          Advance Stage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MATERIAL MANAGEMENT ==================== */}
      {activeTab === 'materials' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Metal Powder & Alloy Inventory Catalog
              </h3>
              <p className="text-xs text-slate-400">
                Configure metal alloys, density constants, raw powder costs, laser scan speeds, and minimum printable wall thicknesses.
              </p>
            </div>

            <button
              onClick={handleOpenAddMaterial}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Add Metal Alloy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  mat.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-700"
                        style={{ backgroundColor: mat.color_hex }}
                      />
                      <h4 className="font-bold text-sm text-slate-100">{mat.name}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        mat.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {mat.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Density:</span>
                      <span className="text-slate-200">{mat.density_g_cm3} g/cm³</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Raw Powder:</span>
                      <span className="text-slate-200">${mat.raw_cost_per_g}/g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Laser Speed:</span>
                      <span className="text-slate-200">{mat.laser_rate_cm3_hr} cm³/hr</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-sans">Machine Rate:</span>
                      <span className="text-slate-200">${mat.machine_hourly_rate}/hr</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans">Min Feature Wall: </span>
                        <span className="text-cyan-300 font-semibold">≥ {mat.min_wall_recommended_mm} mm</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans">Optical: </span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          (mat.optical_type || mat.opticalType) === 'TRANSPARENT'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : (mat.optical_type || mat.opticalType) === 'TRANSLUCENT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {mat.optical_type || mat.opticalType || 'OPAQUE'} [T={(mat.transmission_factor !== undefined ? mat.transmission_factor : (mat.transmissionFactor || 0.0)).toFixed(2)}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleMaterial(mat.id)}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {mat.is_active ? (
                      <span className="text-amber-400 flex items-center gap-1">Disable</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">Enable</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditMaterial(mat)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Properties
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MACHINING SERVICES MANAGEMENT ==================== */}
      {activeTab === 'services' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Secondary Machining & Finishing Services Catalog
              </h3>
              <p className="text-xs text-slate-400">
                Configure surface textures, CNC milling & threading rates, wire EDM cutoff fees, and vacuum furnace thermal cycles.
              </p>
            </div>

            <button
              onClick={handleOpenAddService}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Add Machining Service
            </button>
          </div>

          {/* Grouped Services */}
          {['surface_finish', 'cnc_operation', 'heat_treatment'].map((cat) => {
            const catServices = services.filter((s) => s.category === cat);
            const catLabels = {
              surface_finish: 'Surface Finishes & Polishing',
              cnc_operation: 'Precision CNC Machining & Secondary Operations',
              heat_treatment: 'Vacuum Furnace Heat Treatments & HIP'
            };

            return (
              <div key={cat} className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {catLabels[cat]} ({catServices.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catServices.map((svc) => (
                    <div
                      key={svc.id}
                      className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between ${
                        svc.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/50 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-slate-100">{svc.name}</h5>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            ${svc.base_price.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal"> / {svc.unit.replace('_', ' ')}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{svc.description}</p>
                        <div className="text-[10px] text-slate-500 font-mono mt-2">
                          Spec: {svc.spec_detail || 'Standard tolerance'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <button
                          onClick={() => handleToggleService(svc.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {svc.is_active ? (
                            <span className="text-amber-400">Disable</span>
                          ) : (
                            <span className="text-emerald-400">Enable</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditService(svc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Pricing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== TAB: 3D PRINTERS, LIMITS & RELATIONAL MAPPINGS ==================== */}
      {activeTab === 'machines' && (() => {
        const filteredMachines = machines.filter((m) => {
          const q = (machineSearchQuery || '').toLowerCase();
          const matchesSearch = !machineSearchQuery ||
            m.name?.toLowerCase().includes(q) ||
            m.manufacturer?.toLowerCase().includes(q) ||
            m.technology?.toLowerCase().includes(q);

          const matchesTech = machineTechFilter === 'ALL' ||
            (machineTechFilter === 'DMLS' && (m.technology?.includes('DMLS') || m.technology?.includes('SLM') || m.technology?.includes('LPBF'))) ||
            (machineTechFilter === 'SLA' && (m.technology?.includes('SLA') || m.technology?.includes('Stereolithography'))) ||
            (machineTechFilter === 'POLYJET' && (m.technology?.includes('PolyJet') || m.technology?.includes('Multi-Material')));

          const matchesStatus = machineStatusFilter === 'ALL' || m.status === machineStatusFilter;
          return matchesSearch && matchesTech && matchesStatus;
        });

        const totalChamberLiters = machines.reduce((acc, m) => {
          const vol = (m.build_volume_x_mm * m.build_volume_y_mm * m.build_volume_z_mm) / 1000000;
          return acc + (isNaN(vol) ? 0 : vol);
        }, 0).toFixed(1);

        const activeCount = machines.filter((m) => m.is_active && m.status === 'ACTIVE').length;
        const totalMaterialsLinked = new Set(machines.flatMap((m) => Array.isArray(m.supported_materials) ? m.supported_materials : [])).size;

        return (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
            {/* Header Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  3D Printer Fleet & Limits Management
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Manage additive manufacturing hardware, DFM resolution constraints (chamber envelope, min/max wall thickness), and relational mappings for compatible materials, post-processing, and add-on features.
                </p>
              </div>

              <button
                onClick={handleOpenAddMachine}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 self-start sm:self-auto shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Add 3D Printer
              </button>
            </div>

            {/* Fleet Summary KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Printers</span>
                <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
                  {machines.length}
                  <span className="text-[11px] font-normal text-slate-500">systems</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active In Production</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
                  {activeCount}
                  <span className="text-[11px] font-normal text-slate-500">operational</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Fleet Chamber Envelope</span>
                <div className="text-xl font-bold text-cyan-400 mt-1 flex items-baseline gap-1.5">
                  {totalChamberLiters}
                  <span className="text-[11px] font-normal text-slate-500">Liters total</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active Material Links</span>
                <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-1.5">
                  {totalMaterialsLinked}
                  <span className="text-[11px] font-normal text-slate-500">alloys & resins</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search printer name, OEM, or technology..."
                  value={machineSearchQuery}
                  onChange={(e) => setMachineSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Technology Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium">
                <button
                  onClick={() => setMachineTechFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    machineTechFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Tech
                </button>
                <button
                  onClick={() => setMachineTechFilter('DMLS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    machineTechFilter === 'DMLS'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  DMLS / LPBF Metal
                </button>
                <button
                  onClick={() => setMachineTechFilter('SLA')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    machineTechFilter === 'SLA'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  SLA Optical Clear
                </button>
                <button
                  onClick={() => setMachineTechFilter('POLYJET')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    machineTechFilter === 'POLYJET'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  PolyJet Multi-Material
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={machineStatusFilter}
                onChange={(e) => setMachineStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            {/* Machines Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredMachines.map((m) => {
                const statusColors = {
                  ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  MAINTENANCE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  OFFLINE: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                };

                const chamberLiters = ((m.build_volume_x_mm * m.build_volume_y_mm * m.build_volume_z_mm) / 1000000).toFixed(1);
                const linkedMatIds = Array.isArray(m.supported_materials) ? m.supported_materials : [];
                const linkedPostProcIds = Array.isArray(m.supported_post_processing) ? m.supported_post_processing : [];
                const linkedAddonIds = Array.isArray(m.supported_addons) ? m.supported_addons : [];

                return (
                  <div
                    key={m.id}
                    className={`bg-slate-950/80 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                      m.is_active ? 'border-slate-800 hover:border-slate-700 shadow-lg' : 'border-rose-900/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Machine Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-white">{m.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusColors[m.status] || statusColors.ACTIVE}`}>
                              {m.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span className="text-slate-300 font-medium">{m.manufacturer}</span>
                            <span>•</span>
                            <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-[10px]">
                              {m.technology}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400 text-sm">
                            ${m.hourly_rate?.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal"> / hr</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Hourly Rate</span>
                        </div>
                      </div>

                      {/* Build Envelope Card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            Build Chamber Envelope (X × Y × Z)
                          </span>
                          <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 font-bold">
                            {chamberLiters} Liters
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs mt-2">
                          <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block uppercase">X-Axis</span>
                            <span className="text-white font-bold">{m.build_volume_x_mm} mm</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block uppercase">Y-Axis</span>
                            <span className="text-white font-bold">{m.build_volume_y_mm} mm</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block uppercase">Z-Height</span>
                            <span className="text-white font-bold">{m.build_volume_z_mm} mm</span>
                          </div>
                        </div>
                      </div>

                      {/* Geometric DFM Resolution & Physical Limits */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            Geometric DFM & Wall Limits
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">DFM Constraints</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                            <div className="text-[10px] text-slate-400 font-sans">Min Supported</div>
                            <div className="text-cyan-300 font-bold mt-0.5">≥ {m.min_supported_wall_mm} mm</div>
                            <div className="text-[9px] text-slate-500 font-sans">Anchored</div>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                            <div className="text-[10px] text-slate-400 font-sans">Min Unsupp.</div>
                            <div className="text-amber-300 font-bold mt-0.5">≥ {m.min_unsupported_wall_mm} mm</div>
                            <div className="text-[9px] text-slate-500 font-sans">Cantilever</div>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                            <div className="text-[10px] text-slate-400 font-sans">Max Solid Wall</div>
                            <div className="text-emerald-300 font-bold mt-0.5">≤ {m.max_wall_thickness_mm || 80.0} mm</div>
                            <div className="text-[9px] text-slate-500 font-sans">Sink Prevention</div>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                            <div className="text-[10px] text-slate-400 font-sans">Min Hole Dia</div>
                            <div className="text-slate-200 font-bold mt-0.5">≥ {m.min_hole_diameter_mm} mm</div>
                            <div className="text-[9px] text-slate-500 font-sans">Internal Voids</div>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                            <div className="text-[10px] text-slate-400 font-sans">Min Pin Dia</div>
                            <div className="text-slate-200 font-bold mt-0.5">≥ {m.min_pin_diameter_mm} mm</div>
                            <div className="text-[9px] text-slate-500 font-sans">Fine Posts</div>
                          </div>
                        </div>
                      </div>

                      {/* Laser / Engine Optics & Layer Range */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Optical / Laser Power</span>
                          <span className="text-slate-300 font-bold">{m.laser_power_watts} W</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Beam Spot Size</span>
                          <span className="text-slate-300 font-bold">{m.laser_spot_diameter_um} µm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Layer Height Range</span>
                          <span className="text-slate-300 font-bold">{m.min_layer_thickness_um} - {m.max_layer_thickness_um} µm</span>
                        </div>
                      </div>

                      {/* ================= RELATIONAL MAPPINGS ================= */}
                      <div className="space-y-3 pt-2 border-t border-slate-800/80">
                        {/* 1. Linked Materials */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-cyan-400" />
                              Linked Materials
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">
                              {linkedMatIds.length} Linked
                            </span>
                          </div>
                          {linkedMatIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {linkedMatIds.map((matId) => {
                                const matObj = materials.find((x) => x.id === matId);
                                const isOptical = matObj?.is_transparent;
                                return (
                                  <span
                                    key={matId}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                                      isOptical
                                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                                        : 'bg-slate-900 border-slate-700/80 text-slate-300'
                                    }`}
                                  >
                                    {matObj?.color_hex && (
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matObj.color_hex }} />
                                    )}
                                    {matObj?.name ? matObj.name.split(' ')[0] + ' ' + (matObj.name.split(' ')[1] || '') : matId}
                                    {isOptical && <span className="text-[9px] text-amber-400">★Optical</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">No materials linked yet. Click Configure to link.</div>
                          )}
                        </div>

                        {/* 2. Supported Post-Processing */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              Allowed Post-Processing Techniques
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
                              {linkedPostProcIds.length} Enabled
                            </span>
                          </div>
                          {linkedPostProcIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {linkedPostProcIds.slice(0, 5).map((procId) => {
                                const procObj = AVAILABLE_POST_PROCESSING.find((x) => x.id === procId);
                                return (
                                  <span
                                    key={procId}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/30 border border-emerald-800/50 text-emerald-200 flex items-center gap-1"
                                  >
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    {procObj?.name || procId}
                                  </span>
                                );
                              })}
                              {linkedPostProcIds.length > 5 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                                  +{linkedPostProcIds.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">No post-processing linked yet.</div>
                          )}
                        </div>

                        {/* 3. Product Add-On Features */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              Enabled Product Add-Ons & Hardware
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 font-bold">
                              {linkedAddonIds.length} Active
                            </span>
                          </div>
                          {linkedAddonIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {linkedAddonIds.slice(0, 4).map((addonId) => {
                                const addonObj = AVAILABLE_ADDONS.find((x) => x.id === addonId);
                                return (
                                  <span
                                    key={addonId}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/30 border border-amber-800/50 text-amber-200 flex items-center gap-1"
                                  >
                                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                                    {addonObj?.name || addonId}
                                  </span>
                                );
                              })}
                              {linkedAddonIds.length > 4 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                                  +{linkedAddonIds.length - 4} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">No add-on features enabled yet.</div>
                          )}
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* Machine Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleMachine(m.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {m.is_active ? (
                          <span className="text-amber-400 hover:underline">Deactivate</span>
                        ) : (
                          <span className="text-emerald-400 hover:underline">Activate Machine</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditMachine(m)}
                        className="px-3.5 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 transition-all shadow-sm font-semibold"
                      >
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        Configure Limits & Relational Mappings
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ==================== TAB: POST-PROCESSING TECHNIQUES MANAGEMENT ==================== */}
      {activeTab === 'postproc' && (() => {
        const filteredPostProc = postProcessingList.filter((p) => {
          const q = (postProcSearchQuery || '').toLowerCase();
          const matchesSearch = !postProcSearchQuery ||
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q);

          const matchesCat = postProcCategoryFilter === 'ALL' || p.category === postProcCategoryFilter;
          const matchesStatus = postProcStatusFilter === 'ALL' ||
            (postProcStatusFilter === 'ACTIVE' && p.is_active) ||
            (postProcStatusFilter === 'DISABLED' && !p.is_active);

          return matchesSearch && matchesCat && matchesStatus;
        });

        const activeCount = postProcessingList.filter((p) => p.is_active).length;
        const disabledCount = postProcessingList.length - activeCount;
        const avgLeadTime = postProcessingList.length > 0
          ? (postProcessingList.reduce((acc, p) => acc + (p.lead_time_days || 1), 0) / postProcessingList.length).toFixed(1)
          : '0.0';

        return (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
            {/* Header Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Post-Processing Techniques Catalog & Scope Management
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Centralized management for secondary surface treatments, optical clearcoat dips, and metallurgical vacuum thermal cycles. Configure lead time in business days, flat-rate vs. per-part pricing models, and material compatibility restrictions or machine-level scoping.
                </p>
              </div>

              <button
                onClick={handleOpenAddPostProc}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 self-start sm:self-auto shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Add Post-Processing Technique
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Catalog Items</span>
                <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
                  {postProcessingList.length}
                  <span className="text-[11px] font-normal text-slate-500">techniques</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active In Production</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
                  {activeCount}
                  <span className="text-[11px] font-normal text-slate-500">enabled</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Archived / Disabled</span>
                <div className="text-xl font-bold text-slate-400 mt-1 flex items-baseline gap-1.5">
                  {disabledCount}
                  <span className="text-[11px] font-normal text-slate-500">archived</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Average Lead Time</span>
                <div className="text-xl font-bold text-cyan-400 mt-1 flex items-baseline gap-1.5">
                  +{avgLeadTime}
                  <span className="text-[11px] font-normal text-slate-500">business days</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search techniques, descriptions, or categories..."
                  value={postProcSearchQuery}
                  onChange={(e) => setPostProcSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium">
                {['ALL', 'Surface Finish', 'Optical & Resin', 'Metallurgical'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPostProcCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      postProcCategoryFilter === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={postProcStatusFilter}
                onChange={(e) => setPostProcStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DISABLED">Archived / Disabled Only</option>
              </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPostProc.map((proc) => {
                const hasMatRestrictions = Array.isArray(proc.compatible_material_ids) && proc.compatible_material_ids.length > 0;

                return (
                  <div
                    key={proc.id}
                    className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      proc.is_active ? 'border-slate-800 hover:border-slate-700 shadow-md' : 'border-rose-900/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{proc.name}</h4>
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-emerald-400 border border-slate-800">
                            {proc.category}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                            proc.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {proc.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {/* Lead Time & Pricing Row */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Lead Time:</span>
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            +{proc.lead_time_days} Business Days
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Pricing Model:</span>
                          <span className="text-emerald-400 font-bold">
                            ${proc.base_price?.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal"> ({proc.pricing_model === 'flat_rate' ? 'Flat Rate' : 'Per Part'})</span>
                          </span>
                        </div>
                      </div>

                      {/* Material Restrictions / Machine-Level Scope */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                          Scope & Material Compatibility:
                        </span>
                        {hasMatRestrictions ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-amber-300 font-semibold block flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              Restricted to {proc.compatible_material_ids.length} Certified Alloys/Resins:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {proc.compatible_material_ids.map((matId) => {
                                const matObj = materials.find((m) => m.id === matId);
                                return (
                                  <span
                                    key={matId}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1"
                                  >
                                    {matObj?.color_hex && (
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matObj.color_hex }} />
                                    )}
                                    {matObj?.name ? matObj.name.split(' ')[0] : matId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            Universal Scope (Machine-Level / All Materials)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                        {proc.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleTogglePostProc(proc.id)}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {proc.is_active ? (
                          <span className="text-amber-400 hover:underline">Disable</span>
                        ) : (
                          <span className="text-emerald-400 hover:underline">Enable Technique</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditPostProc(proc)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Properties
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ==================== TAB: PRODUCT ADD-ON FEATURES MANAGEMENT ==================== */}
      {activeTab === 'addons' && (() => {
        const filteredAddons = addonsList.filter((a) => {
          const q = (addonSearchQuery || '').toLowerCase();
          const matchesSearch = !addonSearchQuery ||
            a.name?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q) ||
            a.category?.toLowerCase().includes(q);

          const matchesCat = addonCategoryFilter === 'ALL' || a.category === addonCategoryFilter;
          const matchesStatus = addonStatusFilter === 'ALL' ||
            (addonStatusFilter === 'ACTIVE' && a.is_active) ||
            (addonStatusFilter === 'DISABLED' && !a.is_active);

          return matchesSearch && matchesCat && matchesStatus;
        });

        const activeCount = addonsList.filter((a) => a.is_active).length;
        const disabledCount = addonsList.length - activeCount;
        const avgLeadTime = addonsList.length > 0
          ? (addonsList.reduce((acc, a) => acc + (a.lead_time_days || 1), 0) / addonsList.length).toFixed(1)
          : '0.0';

        return (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
            {/* Header Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Product Add-On Features & Secondary Operations
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Centralized management for secondary CNC operations, custom luminaire LED engines, exhibition display hardware, and expedited courier logistics. Configure lead time days and flat rate vs. per-part pricing.
                </p>
              </div>

              <button
                onClick={handleOpenAddAddon}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 self-start sm:self-auto shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Add Product Add-On
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Add-On Features</span>
                <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
                  {addonsList.length}
                  <span className="text-[11px] font-normal text-slate-500">features</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active In Catalog</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
                  {activeCount}
                  <span className="text-[11px] font-normal text-slate-500">enabled</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Archived / Disabled</span>
                <div className="text-xl font-bold text-slate-400 mt-1 flex items-baseline gap-1.5">
                  {disabledCount}
                  <span className="text-[11px] font-normal text-slate-500">archived</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Average Lead Time</span>
                <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-1.5">
                  +{avgLeadTime}
                  <span className="text-[11px] font-normal text-slate-500">business days</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search features, descriptions, or categories..."
                  value={addonSearchQuery}
                  onChange={(e) => setAddonSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium">
                {['ALL', 'Subtractive CNC', 'Custom Light', 'Exhibition', 'Logistics'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAddonCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      addonCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={addonStatusFilter}
                onChange={(e) => setAddonStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DISABLED">Archived / Disabled Only</option>
              </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAddons.map((addon) => {
                const hasMatRestrictions = Array.isArray(addon.compatible_material_ids) && addon.compatible_material_ids.length > 0;

                return (
                  <div
                    key={addon.id}
                    className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      addon.is_active ? 'border-slate-800 hover:border-slate-700 shadow-md' : 'border-rose-900/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{addon.name}</h4>
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-amber-400 border border-slate-800">
                            {addon.category}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                            addon.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {addon.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {/* Lead Time & Pricing Row */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Lead Time:</span>
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            +{addon.lead_time_days} Business Days
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Pricing Model:</span>
                          <span className="text-emerald-400 font-bold">
                            ${addon.base_price?.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal"> ({addon.pricing_model === 'flat_rate' ? 'Flat Rate' : 'Per Part'})</span>
                          </span>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      <div>
                        {hasMatRestrictions ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-amber-300 font-semibold block flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              Restricted to {addon.compatible_material_ids.length} Certified Alloys/Resins:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {addon.compatible_material_ids.map((matId) => {
                                const matObj = materials.find((m) => m.id === matId);
                                return (
                                  <span
                                    key={matId}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1"
                                  >
                                    {matObj?.color_hex && (
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matObj.color_hex }} />
                                    )}
                                    {matObj?.name ? matObj.name.split(' ')[0] : matId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            Universal Feature (Any Compatible Machine)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                        {addon.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleAddon(addon.id)}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {addon.is_active ? (
                          <span className="text-amber-400 hover:underline">Disable</span>
                        ) : (
                          <span className="text-emerald-400 hover:underline">Enable Feature</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditAddon(addon)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Properties
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ==================== TAB 4: CLIENT DIRECTORY ==================== */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Registered Customer Accounts
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Orders</th>
                  <th className="py-3 px-3">CAD Models</th>
                  <th className="py-3 px-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-slate-200">{u.full_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{u.email}</td>
                    <td className="py-3 px-3 text-slate-300">{u.company || '—'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300">{u.order_count}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{u.model_count}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: MERCHANT BANK & PAYMENTS SETUP ==================== */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Merchant Bank Account & Payment Gateway</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    READY FOR CARD PROCESSING
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Configure corporate direct deposit routing and payment gateway credentials. When users refill their digital wallets or pay for metal 3D print orders via credit card, funds are cleared through the gateway and deposited into this verified bank account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleVerifyBank}
                disabled={isVerifyingBank}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <ShieldCheck className={`w-4 h-4 ${isVerifyingBank ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                {isVerifyingBank ? 'Validating ACH...' : 'Verify Routing & Account'}
              </button>
              <button
                type="button"
                onClick={handleTriggerPayout}
                disabled={isTriggeringPayout}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                {isTriggeringPayout ? 'Initiating...' : 'Trigger Payout'}
              </button>
            </div>
          </div>

          {/* Alert messages */}
          {bankSuccessMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bankSuccessMsg}</span>
            </div>
          )}

          {bankErrorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{bankErrorMsg}</span>
            </div>
          )}

          {/* Form Grid */}
          <form onSubmit={handleSaveBankConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Corporate Bank Account */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Direct Deposit Bank Account</h4>
                </div>
                {bankConfig?.is_verified ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACH Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                    Pending Verification
                  </span>
                )}
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Corporate Bank / Depository Name</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    placeholder="e.g. JPMorgan Chase Commercial Bank"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Legal Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={bankForm.account_holder}
                    onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                    placeholder="e.g. TitanForge Additive Manufacturing LLC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Must match the registered legal business name on corporate tax filing.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">ABA Routing Transit Number</label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      value={bankForm.routing_number}
                      onChange={(e) => setBankForm({ ...bankForm, routing_number: e.target.value })}
                      placeholder="9 digits (e.g. 021000021)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">9-digit Fedwire / ACH routing</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Account Type</label>
                    <select
                      value={bankForm.account_type}
                      onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="business_checking">Commercial Checking</option>
                      <option value="business_savings">Commercial Savings / Treasury</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Account Number</label>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Current: {bankConfig?.account_number_masked || '••••••••8849'}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    placeholder="Enter new account number (leave blank to keep current)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Encrypted at rest with AES-256-GCM. Stored in masked format for PCI compliance.</span>
                </div>
              </div>
            </div>

            {/* Box 2: Payment Gateway & Credit Card Processor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Card Gateway & Processor</h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60">
                  PCI-DSS Level 1
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Gateway Engine</label>
                  <select
                    value={bankForm.gateway_provider}
                    onChange={(e) => setBankForm({ ...bankForm, gateway_provider: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  >
                    <option value="Stripe Additive Gateway">Stripe Additive Gateway (Recommended)</option>
                    <option value="Adyen Industrial Payments">Adyen Industrial Payments</option>
                    <option value="Authorize.Net Commercial">Authorize.Net Commercial</option>
                    <option value="Braintree Global">Braintree Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Merchant Account ID</label>
                  <input
                    type="text"
                    required
                    value={bankForm.merchant_id}
                    onChange={(e) => setBankForm({ ...bankForm, merchant_id: e.target.value })}
                    placeholder="e.g. acct_1N9472918840"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Live Secret API Key</label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {bankConfig?.api_key_masked || 'sk_live_••••••••9482'}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={bankForm.api_key}
                    onChange={(e) => setBankForm({ ...bankForm, api_key: e.target.value })}
                    placeholder="Enter new secret key to update (sk_live_...)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Live API token used by backend to charge Visa, Mastercard, AMEX & refill client wallets.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Settlement Payout Schedule</label>
                    <select
                      value={bankForm.payout_schedule}
                      onChange={(e) => setBankForm({ ...bankForm, payout_schedule: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="daily_rolling">Daily Rolling (T+1)</option>
                      <option value="weekly_monday">Weekly on Monday</option>
                      <option value="monthly">Monthly Settlement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Settlement Currency</label>
                    <select
                      value={bankForm.currency}
                      onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="CAD">CAD ($ - Canadian Dollar)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="lg:col-span-2 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Last synchronized: {bankConfig?.updated_at ? new Date(bankConfig.updated_at).toLocaleString() : 'Just now'}. Changes take effect immediately across all customer checkout workflows.
                </span>
              </div>
              <button
                type="submit"
                disabled={isBankSaving}
                className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
              >
                <Save className="w-4 h-4" />
                {isBankSaving ? 'Saving Configuration...' : 'Save Bank & Gateway Settings'}
              </button>
            </div>
          </form>

          {/* Bank Settlement Payouts Ledger */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  Bank Settlement Direct Deposit Transfers
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated ACH transfers deposited into {bankConfig?.bank_name || 'your corporate bank'} ({bankConfig?.account_number_masked || '••••8849'})
                </p>
              </div>
              <button
                type="button"
                onClick={handleTriggerPayout}
                disabled={isTriggeringPayout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {isTriggeringPayout ? 'Processing...' : 'Simulate Payout Now'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Payout Reference</th>
                    <th className="py-2.5 px-3">Destination Bank & Account</th>
                    <th className="py-2.5 px-3">Orders Settled</th>
                    <th className="py-2.5 px-3">Initiated Date</th>
                    <th className="py-2.5 px-3">Expected Arrival</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {payouts.length > 0 ? (
                    payouts.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-300">{po.id}</td>
                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-medium">{po.destination_bank}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{po.destination_account}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{po.transaction_count} orders</td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(po.initiated_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{po.arrival_date}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              po.status === 'SETTLED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          ${Number(po.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        No settlement payouts logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: IP & LEGAL DISCLAIMER SETTINGS ==================== */}
      {activeTab === 'disclaimer' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">Intellectual Property & Legal Disclaimer Clickwrap Management</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                    disclaimer.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${disclaimer.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {disclaimer.isActive ? `CLICKWRAP ACTIVE (v${disclaimer.version})` : 'ENFORCEMENT PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Configure the mandatory clickwrap gate required on all customer quotes and orders. Protects TitanForge from patent, copyright, and trademark infringement, requires warranties of ownership, strictly prohibits firearms & ITAR articles, and establishes the platform's right to refuse and purge files.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Test Customer Modal</span>
              </button>
              <button
                type="button"
                onClick={handleResetDisclaimerDefaults}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
                title="Reset text fields to standard TitanForge default legal clauses"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Feedback Alert Banner */}
          {disclaimerFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              disclaimerFeedback.startsWith('Error')
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200 animate-in fade-in'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{disclaimerFeedback}</span>
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Disclaimer Editor (7 cols) */}
            <form onSubmit={handleSaveDisclaimer} className="lg:col-span-7 space-y-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Disclaimer Settings & Clauses</h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Version: <strong className="text-cyan-300 font-bold">{disclaimer.version}</strong>
                </span>
              </div>

              {/* Title & Version Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Disclaimer Document Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={disclaimer.title}
                    onChange={(e) => setDisclaimer({ ...disclaimer, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    placeholder="e.g. Intellectual Property & Legal Manufacturing Terms"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Version Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={disclaimer.version}
                    onChange={(e) => setDisclaimer({ ...disclaimer, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-center"
                    placeholder="e.g. 1.0 or 1.1"
                  />
                </div>
              </div>

              {/* WORM Immutability & Retention Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    WORM Ledger Retention Lock (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={disclaimer.wormRetentionYears || 7}
                    onChange={(e) => setDisclaimer({ ...disclaimer, wormRetentionYears: parseInt(e.target.value) || 7 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    SEC 17a-4 / FINRA true WORM cryptographic lock period (default: 7 years).
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Raw CAD Geometry Retention (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="3650"
                    required
                    value={disclaimer.cadRetentionDays || 90}
                    onChange={(e) => setDisclaimer({ ...disclaimer, cadRetentionDays: parseInt(e.target.value) || 90 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Automatic purge countdown for customer raw CAD files (default: 90 days, suspended by Legal Hold).
                  </p>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white">Enforce Mandatory Clickwrap Checkbox</div>
                  <div className="text-[11px] text-slate-400">
                    When active, customers cannot submit quotes or checkout without affirmatively checking this certification.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisclaimer({ ...disclaimer, isActive: !disclaimer.isActive })}
                  className="cursor-pointer text-slate-300 hover:text-white"
                >
                  {disclaimer.isActive ? (
                    <ToggleRight className="w-7 h-7 text-emerald-400 transition-colors" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* Short Checkbox Summary Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <span>Mandatory Checkbox Text (Short Summary)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {disclaimer.checkboxText?.length || 0} characters
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This summary appears immediately alongside the mandatory checkbox directly above the checkout submission button.
                </p>
                <textarea
                  rows={3}
                  required
                  value={disclaimer.checkboxText}
                  onChange={(e) => setDisclaimer({ ...disclaimer, checkboxText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                  placeholder="I certify that I own the intellectual property rights..."
                />
              </div>

              {/* Full Terms Content (Markdown / HTML) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <span>Full Terms & Conditions (Markdown / Clauses)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>{(disclaimer.fullTermsContent || '').split(/\s+/).filter(Boolean).length} words</span>
                    <span>•</span>
                    <span>{(disclaimer.fullTermsContent || '').length} characters</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Detailed legal text rendered inside the modal when the customer clicks "Review Full IP & Indemnification Terms".
                </p>

                {/* Clause quick tags */}
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  {[
                    '1. IP Ownership & Warranties',
                    '2. Indemnification & Defense',
                    '3. Prohibited Firearms & ITAR',
                    '4. Right to Refuse & Purge'
                  ].map((clauseTag) => (
                    <span
                      key={clauseTag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 border border-slate-700/60 text-slate-300"
                    >
                      {clauseTag}
                    </span>
                  ))}
                </div>

                <textarea
                  rows={15}
                  required
                  value={disclaimer.fullTermsContent}
                  onChange={(e) => setDisclaimer({ ...disclaimer, fullTermsContent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed select-text"
                  placeholder="# Intellectual Property & Indemnification Terms..."
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-[11px] text-slate-400 font-mono">
                  {disclaimer.updatedAt ? `Last modified: ${new Date(disclaimer.updatedAt).toLocaleString()}` : 'Not yet saved'}
                </span>
                <button
                  type="submit"
                  disabled={isSavingDisclaimer}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingDisclaimer ? 'Saving & Deploying...' : 'Save & Deploy Legal Terms'}
                </button>
              </div>
            </form>

            {/* Column 2: Live Customer Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white">Live Customer Checkout Preview</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    REAL-TIME
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Below is the exact clickwrap gate and interactive behavior presented to customers before authorizing production:
                </p>

                {/* Simulated Customer Clickwrap Box */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    simulatedCheckbox
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-amber-950/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        id="admin-simulated-checkbox"
                        checked={simulatedCheckbox}
                        onChange={(e) => setSimulatedCheckbox(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0 text-left">
                      <label
                        htmlFor="admin-simulated-checkbox"
                        className="text-xs font-medium text-slate-200 cursor-pointer block leading-relaxed select-none"
                      >
                        {disclaimer.checkboxText || "I certify that I own the intellectual property rights..."}
                      </label>

                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="text-[11px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Review Full IP & Indemnification Terms (v{disclaimer.version})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Checkout Button */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Checkout Button State:</span>
                    <span className={simulatedCheckbox ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {simulatedCheckbox ? 'ENABLED (Ready to Authorize)' : 'DISABLED (Locked by Gate)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!simulatedCheckbox}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !simulatedCheckbox
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60 shadow-none'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-98'
                    }`}
                  >
                    {!simulatedCheckbox ? (
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

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed font-mono">
                  💡 Tip: Click the checkbox above or click "Test Customer Modal" to experience the customer workflow directly.
                </div>
              </div>

              {/* Legal Audit Compliance Info Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Database Audit Compliance Tracking
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Whenever a customer authorizes an order, the application writes immutable audit metadata directly into both the <span className="text-cyan-300 font-mono">quotes</span> and <span className="text-cyan-300 font-mono">orders</span> records:
                </p>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-emerald-400">"ip_terms_accepted": 1,</div>
                  <div className="text-cyan-300">"ip_terms_version": "{disclaimer.version}",</div>
                  <div className="text-amber-300">"ip_terms_accepted_at": "{new Date().toISOString()}"</div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  These records serve as legally binding proof of indemnification and ownership certification in case of third-party patent or copyright assertions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: WORM TRANSACTION LEDGER & CRYPTOGRAPHIC PROOF ==================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 text-left">
          {/* Top Banner: Immutable Storage & Merkle Chain */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      True WORM (Write Once, Read Many) Cryptographic Transaction Ledger
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        LAYER 1 & 2 SECURED
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cryptographically chained Merkle blocks • Hardware-enforced read-only immutability • Auto-generated PDF Certificates of Completion
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefreshLedger}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Ledger</span>
                </button>
                <button
                  type="button"
                  onClick={handleVerifyMerkleChain}
                  disabled={isVerifyingMerkle}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isVerifyingMerkle ? 'Verifying Merkle Chain...' : 'Verify Cryptographic Chain'}
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
                <div className="text-[10px] uppercase font-mono text-slate-400">Total Immutable Blocks</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{ledgerEntries.length}</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
                <div className="text-[10px] uppercase font-mono text-slate-400">Default Retention Lock</div>
                <div className="text-xl font-bold font-mono text-indigo-400 mt-0.5">7 Years</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
                <div className="text-[10px] uppercase font-mono text-slate-400">Active Legal Holds</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {ledgerEntries.filter((e) => e.is_legal_hold).length}
                </div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
                <div className="text-[10px] uppercase font-mono text-slate-400">Active Storage Provider</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-1 truncate">
                  {storageConfig.provider_type === 'LOCAL_WORM_VAULT' ? 'LOCAL WORM VAULT' : 'AWS S3 OBJECT LOCK'}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Results Banner if verified */}
          {merkleResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                merkleResult.is_valid
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {merkleResult.is_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider">
                    {merkleResult.is_valid ? 'Merkle Continuity Validated' : 'Cryptographic Verification Warning'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                    {merkleResult.message} • {merkleResult.blocks_verified} block(s) cryptographically chained
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMerkleResult(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Configuration & Architecture Grid (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Storage Provider Settings (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">WORM Cloud / Local Storage Provider</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {storageConfig.provider_type}
                </span>
              </div>

              <form onSubmit={handleSaveStorageConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Storage Architecture Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStorageConfig({ ...storageConfig, provider_type: 'LOCAL_WORM_VAULT' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        storageConfig.provider_type === 'LOCAL_WORM_VAULT'
                          ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs text-white">Local WORM Vault</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        OS-enforced read-only (<code className="text-cyan-300">attrib +r / 0o444</code>). Zero cloud keys required. Runs out of the box.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStorageConfig({ ...storageConfig, provider_type: 'AWS_S3_OBJECT_LOCK' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        storageConfig.provider_type === 'AWS_S3_OBJECT_LOCK'
                          ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs text-white">AWS S3 Object Lock</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Enterprise SEC Rule 17a-4 compliance. Imposes cloud retention locks preventing deletion by root users.
                      </p>
                    </button>
                  </div>
                </div>

                {storageConfig.provider_type === 'AWS_S3_OBJECT_LOCK' && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          S3 Bucket Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={storageConfig.s3_bucket || ''}
                          onChange={(e) => setStorageConfig({ ...storageConfig, s3_bucket: e.target.value })}
                          placeholder="titanforge-worm-ledger-vault"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          AWS Region <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={storageConfig.s3_region || 'us-east-1'}
                          onChange={(e) => setStorageConfig({ ...storageConfig, s3_region: e.target.value })}
                          placeholder="us-east-1"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          AWS Access Key ID
                        </label>
                        <input
                          type="text"
                          value={storageConfig.s3_access_key || ''}
                          onChange={(e) => setStorageConfig({ ...storageConfig, s3_access_key: e.target.value })}
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          AWS Secret Access Key
                        </label>
                        <input
                          type="password"
                          value={storageConfig.s3_secret_key || ''}
                          onChange={(e) => setStorageConfig({ ...storageConfig, s3_secret_key: e.target.value })}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        S3 Object Lock Retention Mode
                      </label>
                      <select
                        value={storageConfig.retention_mode || 'COMPLIANCE'}
                        onChange={(e) => setStorageConfig({ ...storageConfig, retention_mode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      >
                        <option value="COMPLIANCE">COMPLIANCE (Cannot be deleted or overwritten by anyone, including AWS Root)</option>
                        <option value="GOVERNANCE">GOVERNANCE (Cannot be overwritten without special IAM permissions)</option>
                      </select>
                    </div>
                  </div>
                )}

                {storageConfig.provider_type === 'LOCAL_WORM_VAULT' && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Zero-Key Compliant Local Vault Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      Vault Path: <span className="text-slate-200">backend/worm_vault/</span>
                      <br />
                      Upon write completion, all ledger artifacts, PDF certificates, and frozen snapshots are locked at the filesystem level with read-only attributes (<code className="text-cyan-300">0o444 / attrib +r</code>).
                    </p>
                  </div>
                )}

                {storageSaveFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono ${
                      storageSaveFeedback.startsWith('Error')
                        ? 'bg-rose-950/40 border border-rose-500/50 text-rose-300'
                        : 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                    }`}
                  >
                    {storageSaveFeedback}
                  </div>
                )}

                {storageTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono ${
                      storageTestResult.status === 'ok'
                        ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {storageTestResult.status === 'ok' ? '✓ ' : '✕ '}
                    {storageTestResult.message}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestStorage}
                    disabled={isTestingStorage}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTestingStorage ? 'Testing Connection...' : 'Test Storage Connection'}</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Storage Config</span>
                  </button>
                </div>
              </form>
            </div>

            {/* WORM Security Guardrails & Retention Specs (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Dual-Layer WORM Enforcement</h4>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-mono font-bold text-cyan-400 text-[11px] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Layer 1: Application / Model Level</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Attempts to invoke <code className="text-cyan-300">update()</code> or <code className="text-rose-400">delete()</code> on a ledger entry raise an unhandled <code className="text-amber-300">ImmutableWORMRecordError</code> before reaching disk.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-mono font-bold text-indigo-400 text-[11px] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Layer 2: Database Triggers (SQLite / SQL)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      <code className="text-slate-300">trg_prevent_ledger_delete</code> and <code className="text-slate-300">trg_prevent_ledger_update</code> abort and rollback any SQL mutation attempting to alter canonical hashes or delete rows.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-mono font-bold text-emerald-400 text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Retention Policy Timers</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      • <strong>7-Year WORM Lock:</strong> Ledger hashes, certificates & legal terms cannot be deleted.<br />
                      • <strong>90-Day CAD Geometry Retention:</strong> Raw CAD buffers purge after 90 days unless an active <em>Legal Hold</em> is applied.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Transaction Blocks Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Immutable Transaction Ledger Blocks</h4>
                  <p className="text-xs text-slate-400">
                    Displaying {ledgerEntries.length} cryptographically chained transaction records
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search Cert ID, CAD hash, email..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono tracking-wider bg-slate-950/40">
                    <th className="py-3 px-3">Certificate ID</th>
                    <th className="py-3 px-3">Event Type</th>
                    <th className="py-3 px-3">3D Viewport</th>
                    <th className="py-3 px-3">CAD File SHA-256</th>
                    <th className="py-3 px-3">Merkle Hashes</th>
                    <th className="py-3 px-3">7-Yr Lock</th>
                    <th className="py-3 px-3">Legal Hold</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {ledgerEntries
                    .filter((entry) => {
                      if (!ledgerSearch) return true;
                      const q = ledgerSearch.toLowerCase();
                      return (
                        (entry.id || '').toLowerCase().includes(q) ||
                        (entry.cad_file_sha256 || '').toLowerCase().includes(q) ||
                        (entry.actor_email || '').toLowerCase().includes(q) ||
                        (entry.order_id || '').toLowerCase().includes(q) ||
                        (entry.quote_id || '').toLowerCase().includes(q) ||
                        (entry.cad_file_name || '').toLowerCase().includes(q)
                      );
                    })
                    .map((entry) => {
                      return (
                        <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Cert ID */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{entry.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A'}
                            </div>
                          </td>

                          {/* Event Type */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.event_type === 'ORDER_CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : entry.event_type === 'QUOTE_SUBMITTED'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {entry.event_type}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                              {entry.actor_email || 'anonymous'}
                            </div>
                          </td>

                          {/* 3D Viewport Thumbnail */}
                          <td className="py-3 px-3">
                            {entry.cad_thumbnail_data_url ? (
                              <div
                                onClick={() => setSelectedLedgerBlock(entry)}
                                className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer hover:border-cyan-500 transition-all flex items-center justify-center group relative"
                                title="Click to view full snapshot"
                              >
                                <img
                                  src={entry.cad_thumbnail_data_url}
                                  alt="CAD Viewport"
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">
                                None
                              </div>
                            )}
                          </td>

                          {/* CAD File SHA-256 */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] text-slate-200 truncate max-w-[150px]" title={entry.cad_file_sha256}>
                              {entry.cad_file_sha256 ? `${entry.cad_file_sha256.slice(0, 10)}...${entry.cad_file_sha256.slice(-8)}` : 'N/A'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                              {entry.cad_file_name || 'part.stl'} ({((entry.cad_file_size || 0) / 1024).toFixed(1)} KB)
                            </div>
                          </td>

                          {/* Merkle Hashes */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span className="text-slate-500">Cur:</span>
                              <span className="text-indigo-300 font-bold truncate max-w-[110px]" title={entry.ledger_hash}>
                                {entry.ledger_hash ? `${entry.ledger_hash.slice(0, 8)}...` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <Link2 className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                              <span className="text-slate-600">Prev:</span>
                              <span className="truncate max-w-[110px]" title={entry.previous_hash}>
                                {entry.previous_hash ? `${entry.previous_hash.slice(0, 8)}...` : 'GENESIS'}
                              </span>
                            </div>
                          </td>

                          {/* 7-Yr WORM Lock */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 w-max">
                              <Lock className="w-2.5 h-2.5 text-indigo-400" />
                              <span>{entry.worm_retain_until ? entry.worm_retain_until.slice(0, 10) : '2033'}</span>
                            </span>
                          </td>

                          {/* Legal Hold */}
                          <td className="py-3 px-3">
                            {entry.is_legal_hold ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>ON HOLD</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Standard</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* PDF Download */}
                              <a
                                href={api.downloadLedgerCertificateUrl(entry.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                                title="Download PDF Certificate of Completion"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              {/* Snapshot JSON */}
                              <button
                                type="button"
                                onClick={() => setSelectedLedgerBlock(entry)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                                title="View Canonical Frozen Snapshot"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Legal Hold Toggle */}
                              {!entry.is_legal_hold && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLegalHoldModalBlock(entry);
                                    setLegalHoldReason('');
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                                  title="Enact Legal Hold (Prevents CAD purge)"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500 font-sans">
                        No transactions recorded in the WORM ledger yet. Submit a quote or authorize an order to generate the initial genesis block.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================== MODAL: FROZEN SNAPSHOT DETAIL ==================== */}
          {selectedLedgerBlock && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        WORM Block Snapshot: {selectedLedgerBlock.id}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Event: {selectedLedgerBlock.event_type} • Created: {new Date(selectedLedgerBlock.created_at).toUTCString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLedgerBlock(null)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-mono scrollbar-thin">
                  {/* Visual CAD Preview + Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedLedgerBlock.cad_thumbnail_data_url && (
                      <div className="sm:col-span-1 bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
                        <img
                          src={selectedLedgerBlock.cad_thumbnail_data_url}
                          alt="CAD Viewport"
                          className="w-full max-h-40 object-contain rounded-lg"
                        />
                      </div>
                    )}
                    <div className={`space-y-1.5 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800 ${selectedLedgerBlock.cad_thumbnail_data_url ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
                      <div className="text-slate-400">
                        CAD File: <span className="text-slate-200 font-bold">{selectedLedgerBlock.cad_file_name}</span> ({selectedLedgerBlock.cad_file_size} bytes)
                      </div>
                      <div className="text-slate-400 break-all">
                        SHA-256: <span className="text-cyan-400">{selectedLedgerBlock.cad_file_sha256}</span>
                      </div>
                      <div className="text-slate-400 break-all">
                        Ledger Hash: <span className="text-indigo-400">{selectedLedgerBlock.ledger_hash}</span>
                      </div>
                      <div className="text-slate-400 break-all">
                        Previous Hash: <span className="text-slate-500">{selectedLedgerBlock.previous_hash || 'GENESIS'}</span>
                      </div>
                      <div className="text-slate-400">
                        Storage URI: <span className="text-emerald-400">{selectedLedgerBlock.storage_uri || 'LOCAL_WORM_VAULT'}</span>
                      </div>
                      <div className="text-slate-400">
                        Actor: <span className="text-slate-300">{selectedLedgerBlock.actor_email}</span> ({selectedLedgerBlock.actor_ip_address || '127.0.0.1'})
                      </div>
                    </div>
                  </div>

                  {/* Frozen Snapshot JSON */}
                  <div>
                    <div className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Canonical Frozen Snapshot (Immutable Proof):</span>
                      <span className="text-[10px] text-indigo-400 font-mono">RFC-8785 Canonical JSON</span>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed scrollbar-thin select-text">
                      {JSON.stringify(
                        (() => {
                          try {
                            return typeof selectedLedgerBlock.frozen_snapshot_json === 'string'
                              ? JSON.parse(selectedLedgerBlock.frozen_snapshot_json)
                              : selectedLedgerBlock.frozen_snapshot_json;
                          } catch {
                            return selectedLedgerBlock.frozen_snapshot_json;
                          }
                        })(),
                        null,
                        2
                      )}
                    </pre>
                  </div>

                  {/* DFM Geometry Metrics */}
                  {selectedLedgerBlock.dfm_geometry_metrics && (
                    <div>
                      <div className="text-xs font-bold text-slate-300 mb-1">
                        DFM Geometry Verification Metrics:
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-cyan-300 overflow-x-auto max-h-40 leading-relaxed scrollbar-thin select-text">
                        {JSON.stringify(
                          (() => {
                            try {
                              return typeof selectedLedgerBlock.dfm_geometry_metrics === 'string'
                                ? JSON.parse(selectedLedgerBlock.dfm_geometry_metrics)
                                : selectedLedgerBlock.dfm_geometry_metrics;
                            } catch {
                              return selectedLedgerBlock.dfm_geometry_metrics;
                            }
                          })(),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Retained under WORM until {selectedLedgerBlock.worm_retain_until || '2033'}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={api.downloadLedgerCertificateUrl(selectedLedgerBlock.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Certificate</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedLedgerBlock(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MODAL: ENACT LEGAL HOLD ==================== */}
          {legalHoldModalBlock && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Enact WORM Legal Hold</h3>
                    <p className="text-xs text-slate-400 font-mono">Certificate ID: {legalHoldModalBlock.id}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>
                    Applying a Legal Hold locks this transaction and suspends all automated CAD file purges indefinitely (overriding standard 90-day retention policies).
                  </p>
                  <p className="text-amber-400/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30 text-[11px] font-mono">
                    ⚠️ Note: Under WORM protocol, applying a legal hold is a non-reversible compliance action recorded in the immutable audit trail.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Legal Hold Justification / Reference <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={legalHoldReason}
                      onChange={(e) => setLegalHoldReason(e.target.value)}
                      placeholder="e.g., Subpoena #2026-X, IP Dispute Investigation, Regulatory Audit..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setLegalHoldModalBlock(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isEnactingHold || !legalHoldReason.trim()}
                    onClick={handleEnactLegalHold}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isEnactingHold ? 'Enacting Hold...' : 'Enact Immutable Legal Hold'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: TITANFORGE 3D & TRIPO3D API BILLING SETTINGS                        */}
      {/* ========================================================================= */}
      {activeTab === 'titanforge' && (
        <div className="space-y-6 text-left">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      TitanForge 3D & Tripo3D API Billing Settings
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        titanForgeConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {titanForgeConfig.isEnabled ? 'GATEWAY ACTIVE' : 'GATEWAY DISABLED'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Admin-Managed Tripo3D Neural Generative AI API Credentials • Customer Wallet Escrow Rules • Platform Margins
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestTripoConnection}
                  disabled={isTestingTripo}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingTripo ? 'animate-spin' : ''}`} />
                  <span>{isTestingTripo ? 'Pinging Tripo3D...' : 'Test Connection & Balance'}</span>
                </button>
              </div>
            </div>

            {/* Test Connection Result Alert */}
            {tripoTestResult && (
              <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in duration-200 ${
                tripoTestResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {tripoTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold">{tripoTestResult.success ? 'API Connected: ' : 'Connection Warning: '}</span>
                  {tripoTestResult.message}
                </div>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveTitanForgeConfig} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: API Key & Gateway Management */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white">Tripo3D API Credentials</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Gateway Status:</span>
                    <button
                      type="button"
                      onClick={() => setTitanForgeConfig({ ...titanForgeConfig, isEnabled: !titanForgeConfig.isEnabled })}
                      className="cursor-pointer"
                    >
                      {titanForgeConfig.isEnabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tripo3D API Key (Encrypted in Database)
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={titanForgeConfig.apiKey}
                      onChange={(e) => setTitanForgeConfig({ ...titanForgeConfig, apiKey: e.target.value })}
                      placeholder={titanForgeConfig.apiKeyMasked ? `Saved: ${titanForgeConfig.apiKeyMasked}` : 'tsk_...'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    API key is encrypted on the server and never exposed to customer browsers.
                  </p>
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tripo3D OpenAPI Base Endpoint
                  </label>
                  <input
                    type="text"
                    value={titanForgeConfig.baseUrl}
                    onChange={(e) => setTitanForgeConfig({ ...titanForgeConfig, baseUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default: <span className="font-mono text-cyan-400">https://api.tripo3d.ai/v2/openapi</span>
                  </p>
                </div>

                {/* Account Balance Metrics */}
                <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tripo3D Account Balance</div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                      {titanForgeConfig.balanceCredits !== undefined ? `${titanForgeConfig.balanceCredits.toLocaleString()} Credits` : 'Unchecked'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">
                      {titanForgeConfig.lastCheckedAt ? `Checked: ${new Date(titanForgeConfig.lastCheckedAt).toLocaleTimeString()}` : 'Never checked'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Authenticated via SDK</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Customer Wallet Fee Structure */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Customer Wallet Fee Structure</h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Auto-debited from wallet
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">Text-to-3D Base Generation</label>
                      <span className="text-[11px] text-slate-500">Charged per natural language prompt</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={titanForgeConfig.feeStructure?.textTo3dDraftCost ?? 0.50}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, textTo3dDraftCost: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">Image-to-3D Photo Synthesis</label>
                      <span className="text-[11px] text-slate-500">Charged per photo uploaded</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={titanForgeConfig.feeStructure?.imageTo3dDraftCost ?? 0.60}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, imageTo3dDraftCost: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">Mesh Refinement / Remeshing</label>
                      <span className="text-[11px] text-slate-500">High-poly CAD B-Rep remeshing step</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={titanForgeConfig.feeStructure?.meshRefinementCost ?? 0.75}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, meshRefinementCost: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">PBR Texture & Color Baking</label>
                      <span className="text-[11px] text-slate-500">Metallic, roughness, & normal map generation</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={titanForgeConfig.feeStructure?.pbrTextureCost ?? 0.75}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, pbrTextureCost: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">Format Conversion (.STEP / .STL)</label>
                      <span className="text-[11px] text-slate-500">Watertight manufacturing tessellation</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={titanForgeConfig.feeStructure?.formatConversionCost ?? 0.25}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, formatConversionCost: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-300 block">Platform Markup Over Raw Token Cost</label>
                      <span className="text-[11px] text-slate-500">Target minimum gross platform margin</span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-mono">%</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="500"
                        value={titanForgeConfig.feeStructure?.platformMarkupPercent ?? 25.0}
                        onChange={(e) => setTitanForgeConfig({
                          ...titanForgeConfig,
                          feeStructure: { ...titanForgeConfig.feeStructure, platformMarkupPercent: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-6 pl-2 py-1.5 text-xs text-right font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Margin & Unit Economics Live Preview */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Live Platform Margin & Unit Economics Preview</h4>
                </div>
                <span className="text-xs text-slate-400">Based on standard ~10 Tripo tokens (~$0.20 raw API cost)</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estimated Raw API Cost</span>
                  <div className="text-lg font-mono font-bold text-slate-300 mt-1">~$0.20</div>
                  <span className="text-[10px] text-slate-500">Tripo3D token fee</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Customer Wallet Charge</span>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    ${(titanForgeConfig.feeStructure?.textTo3dDraftCost ?? 0.50).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">Deducted from user wallet</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Gross Platform Profit</span>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                    +${Math.max(0, (titanForgeConfig.feeStructure?.textTo3dDraftCost ?? 0.50) - 0.20).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">Net margin per model</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estimated Margin %</span>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                    {(() => {
                      const cost = 0.20;
                      const charge = titanForgeConfig.feeStructure?.textTo3dDraftCost ?? 0.50;
                      return charge > 0 ? `${(((charge - cost) / charge) * 100).toFixed(1)}%` : '0%';
                    })()}
                  </div>
                  <span className="text-[10px] text-slate-500">Gross profit margin</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {titanForgeFeedback && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    {titanForgeFeedback}
                  </span>
                )}
              </span>

              <button
                type="submit"
                disabled={isSavingTitanForge}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingTitanForge ? 'Deploying...' : 'Save & Deploy Billing Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {previewModalOpen && (
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
                      {disclaimer.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      v{disclaimer.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Customer Clickwrap Modal Preview • Applicable to All Additive Production
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300/90 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Legal Notice: As an on-demand contract manufacturer, TitanForge requires affirmative legal certification of IP ownership and indemnification.
                </span>
              </div>

              <div className="space-y-4 whitespace-pre-wrap font-sans text-xs bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 leading-relaxed select-text">
                {disclaimer.fullTermsContent || <p className="text-slate-400 italic">No legal terms configured.</p>}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Clicking accept confirms your legal authority to manufacture this design.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedCheckbox(true);
                    setPreviewModalOpen(false);
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

      {/* ==================== MODAL: ADVANCE ORDER STAGE ==================== */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  Advance Stage: {editingOrder.id}
                </h3>
                <p className="text-xs text-slate-400">
                  Client: {editingOrder.user_name} • Part: {editingOrder.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Production Stage:
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  {ORDER_STAGES.map((stg) => (
                    <option key={stg.key} value={stg.key}>
                      {stg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technician Telemetry / Quality Note:
                </label>
                <textarea
                  rows="3"
                  value={technicianNote}
                  onChange={(e) => setTechnicianNote(e.target.value)}
                  placeholder="e.g. Laser toolpaths loaded on EOS M 290. Build chamber sealed under high-purity argon gas."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Carrier:</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g. FedEx Priority Freight"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tracking #:</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. FX-9402847291"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  {isSubmitting ? 'Updating...' : 'Publish Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT MATERIAL ==================== */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingMaterial ? 'Edit Metal Alloy Properties' : 'Add New Metal Alloy'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alloy Name</label>
                <input
                  type="text"
                  required
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="e.g. Scalmalloy (Al-Mg-Sc Alloy)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Density (g/cm³)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={materialForm.density_g_cm3}
                    onChange={(e) => setMaterialForm({ ...materialForm, density_g_cm3: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Raw Powder Cost ($/g)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={materialForm.raw_cost_per_g}
                    onChange={(e) => setMaterialForm({ ...materialForm, raw_cost_per_g: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Laser Build Rate (cm³/hr)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={materialForm.laser_rate_cm3_hr}
                    onChange={(e) => setMaterialForm({ ...materialForm, laser_rate_cm3_hr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Machine Rate ($/hr)</label>
                  <input
                    type="number"
                    step="1.0"
                    required
                    value={materialForm.machine_hourly_rate}
                    onChange={(e) => setMaterialForm({ ...materialForm, machine_hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Wall Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={materialForm.min_wall_recommended_mm}
                    onChange={(e) => setMaterialForm({ ...materialForm, min_wall_recommended_mm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">3D Viewer Color Hex</label>
                  <input
                    type="text"
                    value={materialForm.color_hex}
                    onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                    placeholder="#94a3b8"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Optical Type (Light Transmission)</label>
                  <select
                    value={materialForm.optical_type || 'OPAQUE'}
                    onChange={(e) => setMaterialForm({ ...materialForm, optical_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="OPAQUE">OPAQUE (Blocks Internal Light)</option>
                    <option value="TRANSLUCENT">TRANSLUCENT (Subsurface Glow Diffusion)</option>
                    <option value="TRANSPARENT">TRANSPARENT (Direct Optical Clarity)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transmission Factor (0.0 - 1.0)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={materialForm.transmission_factor !== undefined ? materialForm.transmission_factor : 0.0}
                    onChange={(e) => setMaterialForm({ ...materialForm, transmission_factor: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineering Description</label>
                <textarea
                  rows="2"
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="Mechanical highlights and engineering use cases..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT MACHINING SERVICE ==================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                {editingService ? 'Edit Machining Service' : 'Add New Machining Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="surface_finish">Surface Finish</option>
                    <option value="cnc_operation">CNC Machining Operation</option>
                    <option value="heat_treatment">Thermal Treatment / HIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pricing Unit</label>
                  <select
                    value={serviceForm.unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="per_part">Per Part</option>
                    <option value="per_hole">Per Hole (e.g. Threading)</option>
                    <option value="per_face">Per Face (e.g. Face Milling)</option>
                    <option value="per_bore">Per Bore (e.g. Reaming)</option>
                    <option value="fixed">Fixed Job Charge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Electro-Polishing or 5-Axis Profiling"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={serviceForm.base_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Technical Specification</label>
                  <input
                    type="text"
                    value={serviceForm.spec_detail}
                    onChange={(e) => setServiceForm({ ...serviceForm, spec_detail: e.target.value })}
                    placeholder="e.g. Ra < 0.4 µm or Flatness 0.02mm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Description</label>
                <textarea
                  rows="2"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Description of the operation, tooling, or thermal profile..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT 3D PRINTER, LIMITS & RELATIONAL WORKBENCH ==================== */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  {editingMachine ? `Configure ${editingMachine.name}` : 'Add New 3D Printer'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure hardware build envelope, DFM wall thickness limits, and relational mappings for materials, post-processing & add-ons.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMachineModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Workbench Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 text-xs shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMachineModalTab('specs')}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  machineModalTab === 'specs'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                1. Specs & DFM Limits
              </button>

              <button
                type="button"
                onClick={() => setMachineModalTab('materials')}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  machineModalTab === 'materials'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                2. Material Linking
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  machineModalTab === 'materials' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {(machineForm.supported_materials || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMachineModalTab('postproc')}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  machineModalTab === 'postproc'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                3. Post-Processing
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  machineModalTab === 'postproc' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {(machineForm.supported_post_processing || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMachineModalTab('addons')}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  machineModalTab === 'addons'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                4. Product Add-Ons
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  machineModalTab === 'addons' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {(machineForm.supported_addons || []).length}
                </span>
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <form onSubmit={handleSaveMachine} className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* ================= TAB 1: SPECS & DFM LIMITS ================= */}
              {machineModalTab === 'specs' && (
                <div className="space-y-4">
                  {/* Basic Machine Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Machine Name</label>
                      <input
                        type="text"
                        required
                        value={machineForm.name}
                        onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                        placeholder="e.g. EOS M 290 or Formlabs Form 4L"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Manufacturer</label>
                      <input
                        type="text"
                        required
                        value={machineForm.manufacturer}
                        onChange={(e) => setMachineForm({ ...machineForm, manufacturer: e.target.value })}
                        placeholder="e.g. EOS GmbH, SLM Solutions, Formlabs"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Additive Technology</label>
                      <select
                        value={machineForm.technology}
                        onChange={(e) => setMachineForm({ ...machineForm, technology: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="DMLS (Direct Metal Laser Sintering)">DMLS (Direct Metal Laser Sintering)</option>
                        <option value="SLM (Selective Laser Melting)">SLM (Selective Laser Melting)</option>
                        <option value="LPBF (Laser Powder Bed Fusion)">LPBF (Laser Powder Bed Fusion)</option>
                        <option value="SLA (Stereolithography Optical)">SLA (Stereolithography Optical)</option>
                        <option value="PolyJet (Multi-Material Jetting)">PolyJet (Multi-Material Jetting)</option>
                        <option value="EBM (Electron Beam Melting)">EBM (Electron Beam Melting)</option>
                        <option value="Metal Binder Jetting">Metal Binder Jetting</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Operational Status</label>
                      <select
                        value={machineForm.status}
                        onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ACTIVE">ACTIVE (Ready for Production)</option>
                        <option value="MAINTENANCE">MAINTENANCE (Filter / Recoater Calibration)</option>
                        <option value="OFFLINE">OFFLINE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Hourly Machine Rate ($/hr)</label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={machineForm.hourly_rate}
                        onChange={(e) => setMachineForm({ ...machineForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Build Chamber Envelope */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Build Chamber Envelope (X × Y × Z)
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                        {((machineForm.build_volume_x_mm * machineForm.build_volume_y_mm * machineForm.build_volume_z_mm) / 1000000).toFixed(2)} Liters Capacity
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Max X-Width (mm)</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={machineForm.build_volume_x_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, build_volume_x_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Max Y-Depth (mm)</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={machineForm.build_volume_y_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, build_volume_y_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Max Z-Height (mm)</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={machineForm.build_volume_z_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, build_volume_z_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical Geometric DFM Limits */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 space-y-2">
                    <span className="font-semibold text-amber-300 block flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Geometric DFM & Wall Thickness Limits
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Min Supported Wall</label>
                        <input
                          type="number"
                          step="0.05"
                          required
                          value={machineForm.min_supported_wall_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, min_supported_wall_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Anchored (mm)</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Min Unsupported Wall</label>
                        <input
                          type="number"
                          step="0.05"
                          required
                          value={machineForm.min_unsupported_wall_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, min_unsupported_wall_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Cantilever (mm)</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Max Solid Wall</label>
                        <input
                          type="number"
                          step="1.0"
                          required
                          value={machineForm.max_wall_thickness_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, max_wall_thickness_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Sink limit (mm)</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Min Hole Dia</label>
                        <input
                          type="number"
                          step="0.05"
                          required
                          value={machineForm.min_hole_diameter_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, min_hole_diameter_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Fluid / EDM (mm)</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Min Pin Dia</label>
                        <input
                          type="number"
                          step="0.05"
                          required
                          value={machineForm.min_pin_diameter_mm}
                          onChange={(e) => setMachineForm({ ...machineForm, min_pin_diameter_mm: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Fine posts (mm)</span>
                      </div>
                    </div>
                  </div>

                  {/* Laser Optics & Slicing */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Laser / Optical Power (W)</label>
                      <input
                        type="number"
                        step="10"
                        required
                        value={machineForm.laser_power_watts}
                        onChange={(e) => setMachineForm({ ...machineForm, laser_power_watts: parseInt(e.target.value) || 400 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Beam Spot Size (µm)</label>
                      <input
                        type="number"
                        step="5"
                        required
                        value={machineForm.laser_spot_diameter_um}
                        onChange={(e) => setMachineForm({ ...machineForm, laser_spot_diameter_um: parseInt(e.target.value) || 100 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Min Layer Height (µm)</label>
                      <input
                        type="number"
                        step="5"
                        required
                        value={machineForm.min_layer_thickness_um}
                        onChange={(e) => setMachineForm({ ...machineForm, min_layer_thickness_um: parseInt(e.target.value) || 20 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Max Layer Height (µm)</label>
                      <input
                        type="number"
                        step="5"
                        required
                        value={machineForm.max_layer_thickness_um}
                        onChange={(e) => setMachineForm({ ...machineForm, max_layer_thickness_um: parseInt(e.target.value) || 60 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Machine & System Notes</label>
                    <textarea
                      rows="2"
                      value={machineForm.description}
                      onChange={(e) => setMachineForm({ ...machineForm, description: e.target.value })}
                      placeholder="System details, inert gas requirements (e.g. Argon 5.0), optical clear resin vat calibration..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 2: MATERIAL LINKING ================= */}
              {machineModalTab === 'materials' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="font-semibold text-white">Compatible Materials Selection</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Link certified powder alloys or optical liquid resins that this machine is authorized to print.
                      </p>
                    </div>

                    {/* Quick Selection Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllMetals}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                      >
                        + All Metals
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectAllResins}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[11px] font-medium border border-amber-800/60"
                      >
                        + All Optical Resins
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllMaterials}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-slate-800"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Search Filter in Modal */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter materials by name or alloy type..."
                      value={materialSearchInModal}
                      onChange={(e) => setMaterialSearchInModal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Materials Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                    {materials
                      .filter((mat) => !materialSearchInModal || mat.name.toLowerCase().includes(materialSearchInModal.toLowerCase()))
                      .map((mat) => {
                        const isLinked = Array.isArray(machineForm.supported_materials) && machineForm.supported_materials.includes(mat.id);
                        return (
                          <div
                            key={mat.id}
                            onClick={() => toggleMaterialLink(mat.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                              isLinked
                                ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md shadow-cyan-950/50'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {mat.color_hex && (
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                                      style={{ backgroundColor: mat.color_hex }}
                                    />
                                  )}
                                  <h5 className="font-bold text-xs text-white leading-tight">{mat.name}</h5>
                                </div>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                  isLinked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                                }`}>
                                  {isLinked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 mt-2">
                                {mat.is_transparent ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950/60 border border-amber-700/60 text-amber-300">
                                    ★ Optical Transparent
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                                    DMLS Metal Powder
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                              <div>Density: <span className="text-slate-200">{mat.density_g_cm3} g/cm³</span></div>
                              <div>Yield: <span className="text-slate-200">{mat.tensile_yield_mpa} MPa</span></div>
                              <div>Base: <span className="text-emerald-400">${mat.cost_per_cm3?.toFixed(2)}/cm³</span></div>
                              <div>Status: <span className={mat.is_active ? 'text-cyan-400' : 'text-rose-400'}>{mat.is_active ? 'Active' : 'Inactive'}</span></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ================= TAB 3: POST-PROCESSING ================= */}
              {machineModalTab === 'postproc' && (() => {
                const activePostProc = postProcessingList.filter((p) => p.is_active);
                const categories = ['Surface Finish', 'Optical & Resin', 'Metallurgical'];

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <h4 className="font-semibold text-white">Post-Processing Techniques Linking</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Only active catalog techniques are available for machine linking. Check material compatibility restrictions below.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMachineForm((prev) => ({
                              ...prev,
                              supported_post_processing: activePostProc.map((p) => p.id)
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-medium border border-emerald-800/60"
                        >
                          + Link All Active ({activePostProc.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllPostProc}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-slate-800"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Grouped by Categories */}
                    {categories.map((categoryName) => {
                      const groupItems = activePostProc.filter((p) => p.category === categoryName);
                      if (groupItems.length === 0) return null;

                      return (
                        <div key={categoryName} className="space-y-2">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            {categoryName} ({groupItems.length})
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {groupItems.map((proc) => {
                              const isLinked = Array.isArray(machineForm.supported_post_processing) && machineForm.supported_post_processing.includes(proc.id);
                              const hasMatRestriction = Array.isArray(proc.compatible_material_ids) && proc.compatible_material_ids.length > 0;
                              const isMaterialLinked = !hasMatRestriction || (machineForm.supported_materials || []).some((mId) => proc.compatible_material_ids.includes(mId));

                              return (
                                <div
                                  key={proc.id}
                                  onClick={() => togglePostProcLink(proc.id)}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 select-none ${
                                    isLinked
                                      ? 'bg-emerald-950/20 border-emerald-500/80 shadow-sm'
                                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-bold text-xs text-white">{proc.name}</h5>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                                        +{proc.lead_time_days || 1}d lead time
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                                        ${proc.base_price?.toFixed(2)} ({proc.pricing_model === 'flat_rate' ? 'Flat' : 'Per-Part'})
                                      </span>
                                    </div>

                                    {/* Material restriction / Scope pill */}
                                    <div className="text-[10px] font-mono">
                                      {hasMatRestriction ? (
                                        <span className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                          isMaterialLinked
                                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                                            : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                                        }`}>
                                          {isMaterialLinked ? '✓ Machine has compatible alloy' : `⚠ Restricted to ${proc.compatible_material_ids.length} alloys`}
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded border bg-slate-900 text-slate-400 border-slate-800 inline-flex items-center gap-1">
                                          Universal (Machine-Level)
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{proc.description}</p>
                                  </div>

                                  <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all mt-0.5 ${
                                    isLinked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                                  }`}>
                                    {isLinked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ================= TAB 4: PRODUCT ADD-ONS ================= */}
              {machineModalTab === 'addons' && (() => {
                const activeAddons = addonsList.filter((a) => a.is_active);
                const categories = ['Subtractive CNC', 'Custom Light', 'Exhibition', 'Logistics'];

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <h4 className="font-semibold text-white">Product Add-On Features Selection</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Only active add-ons are available for machine linking. Check lead times and pricing models.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMachineForm((prev) => ({
                              ...prev,
                              supported_addons: activeAddons.map((a) => a.id)
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[11px] font-medium border border-amber-800/60"
                        >
                          + Link All Active ({activeAddons.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllAddons}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-slate-800"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Grouped by Categories */}
                    {categories.map((categoryName) => {
                      const groupItems = activeAddons.filter((a) => a.category === categoryName);
                      if (groupItems.length === 0) return null;

                      return (
                        <div key={categoryName} className="space-y-2">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {categoryName} ({groupItems.length})
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {groupItems.map((addon) => {
                              const isLinked = Array.isArray(machineForm.supported_addons) && machineForm.supported_addons.includes(addon.id);

                              return (
                                <div
                                  key={addon.id}
                                  onClick={() => toggleAddonLink(addon.id)}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 select-none ${
                                    isLinked
                                      ? 'bg-amber-950/20 border-amber-500/80 shadow-sm'
                                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-bold text-xs text-white">{addon.name}</h5>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                                        +{addon.lead_time_days || 1}d lead time
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40">
                                        ${addon.base_price?.toFixed(2)} ({addon.pricing_model === 'flat_rate' ? 'Flat' : 'Per-Part'})
                                      </span>
                                    </div>

                                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{addon.description}</p>
                                  </div>

                                  <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all mt-0.5 ${
                                    isLinked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                                  }`}>
                                    {isLinked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Sticky Modal Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                {/* Relational Mapping Summary Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-400">
                    {(machineForm.supported_materials || []).length} Materials
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400">
                    {(machineForm.supported_post_processing || []).length} Post-Processes
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-amber-400">
                    {(machineForm.supported_addons || []).length} Add-Ons
                  </span>

                  {machineSaveFeedback && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{machineSaveFeedback}</span>
                    </div>
                  )}
                </div>

                {/* Cancel & Save Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMachineModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMachine}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {isSavingMachine ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================== MODAL: ADD / EDIT POST-PROCESSING TECHNIQUE ==================== */}
      {isPostProcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {editingPostProc ? `Edit Technique: ${editingPostProc.name}` : 'Add Post-Processing Technique'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPostProcModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePostProc} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Technique Name</label>
                <input
                  type="text"
                  required
                  value={postProcForm.name}
                  onChange={(e) => setPostProcForm({ ...postProcForm, name: e.target.value })}
                  placeholder="e.g. Glass Bead Blasting, Optical Dip, or HIP"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={postProcForm.category}
                    onChange={(e) => setPostProcForm({ ...postProcForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Surface Finish">Surface Finish</option>
                    <option value="Optical & Resin">Optical & Resin</option>
                    <option value="Metallurgical">Metallurgical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lead Time (Business Days)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={postProcForm.lead_time_days}
                    onChange={(e) => setPostProcForm({ ...postProcForm, lead_time_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pricing Model</label>
                  <select
                    value={postProcForm.pricing_model}
                    onChange={(e) => setPostProcForm({ ...postProcForm, pricing_model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="per_part">Per-Part Unit Price</option>
                    <option value="flat_rate">Flat Rate (Per Batch / Order)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={postProcForm.base_price}
                    onChange={(e) => setPostProcForm({ ...postProcForm, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Material Restrictions Scope */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 block">
                    Material Compatibility & Scope
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPostProcForm({ ...postProcForm, compatible_material_ids: [] })}
                      className="px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60"
                    >
                      Make Universal (All Materials)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const metalIds = materials.filter((m) => !m.is_transparent).map((m) => m.id);
                        setPostProcForm({ ...postProcForm, compatible_material_ids: metalIds });
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    >
                      Metals Only
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const resinIds = materials.filter((m) => m.is_transparent).map((m) => m.id);
                        setPostProcForm({ ...postProcForm, compatible_material_ids: resinIds });
                      }}
                      className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60"
                    >
                      Resins Only
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  {postProcForm.compatible_material_ids.length === 0
                    ? 'Scope: Machine-Level Universal (Applies to all printed materials).'
                    : `Restricted to ${postProcForm.compatible_material_ids.length} specific materials below:`}
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {materials.map((mat) => {
                    const isChecked = postProcForm.compatible_material_ids.includes(mat.id);
                    return (
                      <label key={mat.id} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white p-1 rounded hover:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = [...postProcForm.compatible_material_ids];
                            if (e.target.checked) {
                              setPostProcForm({ ...postProcForm, compatible_material_ids: [...cur, mat.id] });
                            } else {
                              setPostProcForm({ ...postProcForm, compatible_material_ids: cur.filter((id) => id !== mat.id) });
                            }
                          }}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="truncate flex items-center gap-1.5 text-[11px]">
                          {mat.color_hex && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mat.color_hex }} />
                          )}
                          {mat.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description & Technical Tolerance</label>
                <textarea
                  rows="2"
                  value={postProcForm.description}
                  onChange={(e) => setPostProcForm({ ...postProcForm, description: e.target.value })}
                  placeholder="Describe treatment procedure, media used, surface roughness Ra, or thermal curve..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="postProcActive"
                  checked={postProcForm.is_active}
                  onChange={(e) => setPostProcForm({ ...postProcForm, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="postProcActive" className="text-slate-300 cursor-pointer">
                  Active in production catalog (Eligible for machine linking)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPostProcModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Save className="w-4 h-4" />
                  Save Technique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT PRODUCT ADD-ON ==================== */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {editingAddon ? `Edit Feature: ${editingAddon.name}` : 'Add Product Add-On Feature'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddonModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feature Name</label>
                <input
                  type="text"
                  required
                  value={addonForm.name}
                  onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                  placeholder="e.g. CNC Thread Tapping, LED Core, or Magnetic Base"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={addonForm.category}
                    onChange={(e) => setAddonForm({ ...addonForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Subtractive CNC">Subtractive CNC</option>
                    <option value="Custom Light">Custom Light</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lead Time (Business Days)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={addonForm.lead_time_days}
                    onChange={(e) => setAddonForm({ ...addonForm, lead_time_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pricing Model</label>
                  <select
                    value={addonForm.pricing_model}
                    onChange={(e) => setAddonForm({ ...addonForm, pricing_model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="per_part">Per-Part Unit Price</option>
                    <option value="flat_rate">Flat Rate (Per Batch / Order)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={addonForm.base_price}
                    onChange={(e) => setAddonForm({ ...addonForm, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feature Description</label>
                <textarea
                  rows="2"
                  value={addonForm.description}
                  onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                  placeholder="Hardware specifications, electrical ratings, tooling requirements, or packaging..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addonActive"
                  checked={addonForm.is_active}
                  onChange={(e) => setAddonForm({ ...addonForm, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="addonActive" className="text-slate-300 cursor-pointer">
                  Active in catalog (Eligible for machine linking)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddonModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Save className="w-4 h-4" />
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
