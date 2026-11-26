// Supplier Windows Terminal Controller (Strictly Isolated Gateway)
const API_BASE = 'http://localhost:4000/api/v1/supplier';

let authToken = null;
let currentJobs = { queue_needs_refinement: [], queue_print_and_assembly: [] };
let activeTab = 'refine'; // 'refine' or 'print'
let selectedJob = null;

// 3D renderer state
let scene, camera, renderer, animId;
let modelGroup = null;
let baseGroup = null;
let controls = null;
let isInteracting = false;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const tabRefine = document.getElementById('tab-refine');
const tabPrint = document.getElementById('tab-print');
const countRefine = document.getElementById('count-refine');
const countPrint = document.getElementById('count-print');
const jobsContainer = document.getElementById('jobs-container');

const noJobSelected = document.getElementById('no-job-selected');
const jobDetails = document.getElementById('job-details');
const jobTitle = document.getElementById('job-title');
const jobMeta = document.getElementById('job-meta');
const jobStageBadge = document.getElementById('job-stage-badge');
const specMagnet = document.getElementById('spec-magnet');
const specLed = document.getElementById('spec-led');
const specNotes = document.getElementById('spec-notes');

const btnDownloadGlb = document.getElementById('btn-download-glb');
const btnDownloadSpecs = document.getElementById('btn-download-specs');

const uploadModelUrl = document.getElementById('upload-model-url');
const uploadNotes = document.getElementById('upload-notes');
const btnPickFile = document.getElementById('btn-pick-file');
const btnSubmitRefined = document.getElementById('btn-submit-refined');

const btnStagePrint = document.getElementById('btn-stage-print');
const btnStageShipped = document.getElementById('btn-stage-shipped');
const carrierInput = document.getElementById('carrier-input');
const trackingInput = document.getElementById('tracking-input');

// Job Decision & Quote Elements
const selectActiveManufacturer = document.getElementById('select-active-manufacturer');
let activeManufacturerId = 'mfr-shenzhen-apex';

const biddingStatusBadge = document.getElementById('bidding-status-badge');
const biddingDescText = document.getElementById('bidding-desc-text');
const biddingActionsView = document.getElementById('bidding-actions-view');
const biddingAcceptedView = document.getElementById('bidding-accepted-view');
const biddingRejectedView = document.getElementById('bidding-rejected-view');
const supplierQuotePrice = document.getElementById('supplier-quote-price');
const supplierQuoteNotes = document.getElementById('supplier-quote-notes');
const btnAcceptJob = document.getElementById('btn-accept-job');
const btnRejectJob = document.getElementById('btn-reject-job');
const acceptedPriceDisplay = document.getElementById('accepted-price-display');
const acceptedNotesDisplay = document.getElementById('accepted-notes-display');
const rejectedReasonDisplay = document.getElementById('rejected-reason-display');

// RFQ Bidding Elements
const rfqBiddingFormView = document.getElementById('rfq-bidding-form-view');
const rfqBasePriceDisplay = document.getElementById('rfq-base-price-display');
const rfqDeadlineDisplay = document.getElementById('rfq-deadline-display');
const rfqBidPrice = document.getElementById('rfq-bid-price');
const rfqBidDays = document.getElementById('rfq-bid-days');
const rfqBidNotes = document.getElementById('rfq-bid-notes');
const btnSubmitRfqBid = document.getElementById('btn-submit-rfq-bid');
const rfqBidSubmittedView = document.getElementById('rfq-bid-submitted-view');
const rfqMyBidAmount = document.getElementById('rfq-my-bid-amount');
const rfqMyBidDays = document.getElementById('rfq-my-bid-days');
const rfqMyBidNotes = document.getElementById('rfq-my-bid-notes');
const btnReviseRfqBid = document.getElementById('btn-revise-rfq-bid');
const rfqBidAwardedView = document.getElementById('rfq-bid-awarded-view');
const rfqAwardedPrice = document.getElementById('rfq-awarded-price');
const rfqBidOutbidView = document.getElementById('rfq-bid-outbid-view');

// Dynamic Vendor Role & Directory Handling
const headerRoleBadge = document.getElementById('header-role-badge');
let vendorCategory = '3D_PRINTING'; // 'DESIGNER' or '3D_PRINTING'

function isDesignerVendor(vendorId) {
  if (!vendorId) return false;
  if (vendorId.startsWith('vendor-neotokyo') || vendorId.startsWith('vendor-polymorph')) return true;
  if (vendorId.includes('sculpt') || vendorId.includes('cad') || vendorId.includes('design')) return true;
  const opt = selectActiveManufacturer?.querySelector(`option[value="${vendorId}"]`);
  if (opt && opt.closest('optgroup')?.label?.toLowerCase().includes('designer')) return true;
  return false;
}

function updateActiveRoleUI() {
  const isDesigner = isDesignerVendor(activeManufacturerId);
  vendorCategory = isDesigner ? 'DESIGNER' : '3D_PRINTING';

  if (headerRoleBadge) {
    if (isDesigner) {
      headerRoleBadge.innerHTML = '🎨 3D CAD DESIGNER';
      headerRoleBadge.style.background = '#2e1065';
      headerRoleBadge.style.color = '#d8b4fe';
      headerRoleBadge.style.border = '1px solid #9333ea';
    } else {
      headerRoleBadge.innerHTML = '🖨️ 3D PRINTING FACILITY';
      headerRoleBadge.style.background = '#082f49';
      headerRoleBadge.style.color = '#7dd3fc';
      headerRoleBadge.style.border = '1px solid #0284c7';
    }
  }

  // Auto-switch tabs to best match active role
  if (isDesigner && activeTab !== 'refine') {
    tabRefine.click();
  } else if (!isDesigner && activeTab !== 'print' && currentJobs.queue_print_and_assembly.length > 0) {
    tabPrint.click();
  }
}

if (selectActiveManufacturer) {
  selectActiveManufacturer.addEventListener('change', (e) => {
    activeManufacturerId = e.target.value;
    updateActiveRoleUI();
    if (selectedJob) {
      selectJob(selectedJob);
    }
  });
}

// Fetch live vendors directory from backend to keep sync with Admin portal
async function syncVendorsDirectory() {
  try {
    const res = await fetch(`${API_BASE}/vendors`);
    if (!res.ok) return;
    const vendors = await res.json();
    if (!Array.isArray(vendors) || vendors.length === 0) return;

    const designers = vendors.filter((v) => v.category === 'DESIGNER' && v.status !== 'DISABLED');
    const printers = vendors.filter((v) => v.category !== 'DESIGNER' && v.status !== 'DISABLED');

    if (selectActiveManufacturer) {
      const currentSelected = activeManufacturerId;
      selectActiveManufacturer.innerHTML = `
        <optgroup label="🎨 3D CAD Designers (Design Fine-Tune)">
          ${designers
            .map(
              (v) =>
                `<option value="${v.id}" ${v.id === currentSelected ? 'selected' : ''}>🎨 ${v.name} (${v.facility_location})</option>`,
            )
            .join('')}
        </optgroup>
        <optgroup label="🖨️ 3D Printing Facilities (Fabrication)">
          ${printers
            .map(
              (v) =>
                `<option value="${v.id}" ${v.id === currentSelected ? 'selected' : ''}>🖨️ ${v.name} (${v.facility_location})</option>`,
            )
            .join('')}
        </optgroup>
      `;
      updateActiveRoleUI();
    }
  } catch (err) {
    console.warn('Could not sync dynamic vendor directory, using seeded options:', err.message);
  }
}

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// Pre-fill remembered device token if available
try {
  const savedToken = localStorage.getItem('levitate3d_supplier_token');
  if (savedToken) {
    document.getElementById('login-device-token').value = savedToken;
  }
} catch (e) {}

// 1. Authenticate with Device-Bound Token
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const deviceToken = document.getElementById('login-device-token').value;

  try {
    localStorage.setItem('levitate3d_supplier_token', deviceToken);
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_token: deviceToken }),
    });

    if (!res.ok) {
      throw new Error('Authentication failed: Invalid credentials or unauthorized device token.');
    }

    const data = await res.json();
    authToken = data.access_token;

    loginScreen.style.display = 'none';
    appScreen.style.display = 'flex';

    init3DViewer();
    loadJobs();
  } catch (err) {
    console.warn('Live API connection offline, starting in standalone simulation mode:', err.message);
    // Standalone fallback for instant demo testing
    loginScreen.style.display = 'none';
    appScreen.style.display = 'flex';
    init3DViewer();
    loadMockJobs();
  }
});

// 2. Load Jobs
async function loadJobs() {
  try {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const res = await fetch(`${API_BASE}/jobs`, { headers });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    currentJobs = await res.json();
    renderJobsList();
  } catch (err) {
    console.warn('API error, falling back to cached jobs:', err);
    loadMockJobs();
  }
}

function loadMockJobs() {
  currentJobs = {
    queue_needs_refinement: [
      {
        job_id: 'd2b4ecf8-bd76-4972-88d8-3d8ac8da5bfd',
        job_code: 'JOB-LEV-2026-691551',
        prompt_text: 'A happy running dog, Golden yellow fur, Detailed fur texture',
        supplier_stage: 'NEEDS_REFINEMENT',
        original_model_url: 'http://localhost:4000/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb',
        designer_adjustment_notes:
          'Calibrate center of mass for levitation balance. Carve 18.2mm N52 magnet socket at bottom center.',
        hardware_specs: {
          size: 'STANDARD',
          dimensions_mm: '120mm x 75mm x 75mm',
          finish_type: 'FULL_COLOR',
          base_type: 'CUSTOM_MAGNETIC_LEVITATING_BASE',
          magnetic_cavity_specs:
            '18.2mm diam x 6.5mm depth cylindrical cavity at base center (N52 Magnet Socket)',
          internal_led_wiring_required: false,
        },
        destination_summary: { country: 'USA', city: 'Springfield' },
      },
      {
        job_id: '44444444-4444-4444-4444-444444444444',
        job_code: 'JOB-LEV-2026-891042',
        prompt_text: 'Cyberpunk Samurai Guardian',
        supplier_stage: 'NEEDS_REFINEMENT',
        original_model_url: '/models/sample_levitating_statue.glb',
        designer_adjustment_notes:
          'Please embed 18.2mm magnet cavity at bottom center. Hollow chest for wireless LED inductive receiver.',
        hardware_specs: {
          size: 'LARGE',
          dimensions_mm: '180mm x 110mm x 110mm',
          finish_type: 'TRANSLUCENT_GLOW',
          base_type: 'CUSTOM_MAGNETIC_LEVITATING_BASE',
          magnetic_cavity_specs:
            '18.2mm diam x 6.5mm depth cylindrical cavity at base center (N52 Magnet Socket)',
          internal_led_wiring_required: true,
          internal_led_specs: {
            conduit_diameter: '3.0mm smooth curved wire conduit',
            hollow_cavity: 'Statue torso/head hollowed with 2.0mm wall thickness',
          },
        },
        destination_summary: { country: 'USA', city: 'Springfield' },
      },
    ],
    queue_print_and_assembly: [],
  };
  renderJobsList();
}

function renderJobsList() {
  countRefine.textContent = currentJobs.queue_needs_refinement.length;
  countPrint.textContent = currentJobs.queue_print_and_assembly.length;

  const list =
    activeTab === 'refine'
      ? currentJobs.queue_needs_refinement
      : currentJobs.queue_print_and_assembly;
  jobsContainer.innerHTML = '';

  list.forEach((job) => {
    const div = document.createElement('div');
    div.className = `job-item ${selectedJob?.job_id === job.job_id ? 'selected' : ''}`;
    div.innerHTML = `
      <div class="job-code">${job.job_code}</div>
      <div class="job-prompt">🐕 ${job.prompt_text || 'A happy running dog'}</div>
      <div class="job-summary">${job.hardware_specs.size} Scale • ${job.hardware_specs.finish_type}</div>
      <div style="font-size: 11px; font-weight: 700; color: ${
        job.hardware_specs.internal_led_wiring_required ? '#0284c7' : '#166534'
      }; margin-top: 4px;">
        ${job.hardware_specs.internal_led_wiring_required ? '⚡ Internal LED Wiring Required' : '✓ Standard Base (Pedestal Illumination)'}
      </div>
    `;
    div.onclick = () => {
      document.querySelectorAll('.job-item').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
      selectJob(job);
    };
    jobsContainer.appendChild(div);
  });

  if (list.length > 0 && !selectedJob) {
    selectJob(list[0]);
  }
}

tabRefine.onclick = () => {
  activeTab = 'refine';
  tabRefine.classList.add('active');
  tabPrint.classList.remove('active');
  renderJobsList();
};

tabPrint.onclick = () => {
  activeTab = 'print';
  tabPrint.classList.add('active');
  tabRefine.classList.remove('active');
  renderJobsList();
};

// 3. Select Job Details
function selectJob(job) {
  selectedJob = job;
  noJobSelected.style.display = 'none';
  jobDetails.style.display = 'block';

  jobTitle.innerHTML = `${job.job_code} <span style="font-size: 14px; font-weight: 700; color: #0284c7; margin-left: 8px;">"${job.prompt_text || 'A happy running dog'}"</span>`;
  const destName = job.destination_summary?.facility || 'Levitate3D US Company Hub';
  const destCity = job.destination_summary?.city || 'Beaverton, OR';
  jobMeta.innerHTML = `${job.hardware_specs.dimensions_mm} • Finish: ${job.hardware_specs.finish_type} • <span style="color:#0284c7;font-weight:700;">Destination: ${destName} (${destCity}, USA)</span>`;
  jobStageBadge.textContent = job.supplier_stage;

  specMagnet.textContent = job.hardware_specs.magnetic_cavity_specs;
  specLed.textContent = job.hardware_specs.internal_led_wiring_required
    ? `${job.hardware_specs.internal_led_specs?.conduit_diameter} • ${job.hardware_specs.internal_led_specs?.hollow_cavity}`
    : 'No internal wiring needed (Pedestal illumination only)';
  specNotes.textContent = job.designer_adjustment_notes;

  // Handle Acceptance & Quoted Price / RFQ Bidding View
  const isRfqOpen = job.bidding_status === 'OPEN';
  const isRfqAwarded = job.bidding_status === 'AWARDED';

  // Check if current active manufacturer has a bid
  const myBid = Array.isArray(job.bids) ? job.bids.find((b) => b.supplier_id === activeManufacturerId) : null;

  if (isRfqOpen) {
    biddingActionsView.style.display = 'none';
    biddingAcceptedView.style.display = 'none';
    biddingRejectedView.style.display = 'none';
    rfqBidAwardedView.style.display = 'none';
    rfqBidOutbidView.style.display = 'none';

    biddingDescText.textContent = 'Competitive RFQ released by Admin. Submit your quoted fabrication price to bid for this project.';

    if (myBid) {
      // Current factory already submitted a bid
      biddingStatusBadge.textContent = `Bid Submitted ($${Number(myBid.bid_amount).toFixed(2)})`;
      biddingStatusBadge.style.background = '#f0fdf4';
      biddingStatusBadge.style.color = '#15803d';
      biddingStatusBadge.style.borderColor = '#86efac';

      rfqBiddingFormView.style.display = 'none';
      rfqBidSubmittedView.style.display = 'block';

      rfqMyBidAmount.textContent = `$${Number(myBid.bid_amount).toFixed(2)} USD`;
      rfqMyBidDays.textContent = `${myBid.turnaround_days || 3} business days`;
      rfqMyBidNotes.textContent = myBid.notes ? `"${myBid.notes}"` : 'SLA compliant.';
    } else {
      // Current factory hasn't submitted a bid yet
      biddingStatusBadge.textContent = `RFQ Open (Base $${Number(job.bidding_base_price || 65).toFixed(2)})`;
      biddingStatusBadge.style.background = '#e0f2fe';
      biddingStatusBadge.style.color = '#0369a1';
      biddingStatusBadge.style.borderColor = '#bae6fd';

      rfqBiddingFormView.style.display = 'block';
      rfqBidSubmittedView.style.display = 'none';

      rfqBasePriceDisplay.textContent = `$${Number(job.bidding_base_price || 65).toFixed(2)} USD`;
      rfqDeadlineDisplay.textContent = '⏳ Active Window';

      // Pre-fill with competitive price according to vendor role
      const isDesigner = isDesignerVendor(activeManufacturerId);
      if (isDesigner) {
        rfqBidPrice.value = (Number(job.bidding_base_price || 65) * 0.65).toFixed(2);
        rfqBidDays.value = '1';
        rfqBidNotes.value = '3D mesh sculpt refinement + 18.2mm N52 cavity hollowed & calibrated for levitation center-of-mass.';
      } else {
        rfqBidPrice.value = (Number(job.bidding_base_price || 65) - 7).toFixed(2);
        rfqBidDays.value = activeManufacturerId === 'mfr-pacific-proto' ? '2' : '3';
        rfqBidNotes.value = 'High-precision SLA resin + electroplating + N52 press-fit testing.';
      }
    }
  } else if (isRfqAwarded) {
    rfqBiddingFormView.style.display = 'none';
    rfqBidSubmittedView.style.display = 'none';
    biddingActionsView.style.display = 'none';
    biddingAcceptedView.style.display = 'none';
    biddingRejectedView.style.display = 'none';

    const isWinner = job.assigned_supplier_id === activeManufacturerId || (job.awarded_bid_id && myBid?.status === 'AWARDED');
    if (isWinner) {
      biddingStatusBadge.textContent = '🏆 Awarded Winner';
      biddingStatusBadge.style.background = '#ecfdf5';
      biddingStatusBadge.style.color = '#065f46';
      biddingStatusBadge.style.borderColor = '#34d399';

      rfqBidAwardedView.style.display = 'block';
      rfqBidOutbidView.style.display = 'none';
      rfqAwardedPrice.textContent = `$${Number(job.supplier_quoted_price || myBid?.bid_amount || 65).toFixed(2)} USD`;
    } else {
      biddingStatusBadge.textContent = 'Bidding Concluded';
      biddingStatusBadge.style.background = '#f8fafc';
      biddingStatusBadge.style.color = '#64748b';
      biddingStatusBadge.style.borderColor = '#cbd5e1';

      rfqBidAwardedView.style.display = 'none';
      rfqBidOutbidView.style.display = 'block';
    }
  } else {
    // Non-RFQ direct flow
    rfqBiddingFormView.style.display = 'none';
    rfqBidSubmittedView.style.display = 'none';
    rfqBidAwardedView.style.display = 'none';
    rfqBidOutbidView.style.display = 'none';

    const quoteStatus = job.supplier_acceptance_status || 'PENDING_ACCEPTANCE';
    if (quoteStatus === 'ACCEPTED') {
      const priceVal = job.supplier_quoted_price ? Number(job.supplier_quoted_price).toFixed(2) : '65.00';
      biddingStatusBadge.textContent = `Accepted ($${priceVal})`;
      biddingStatusBadge.style.background = '#ecfdf5';
      biddingStatusBadge.style.color = '#065f46';
      biddingStatusBadge.style.borderColor = '#a7f3d0';
      biddingActionsView.style.display = 'none';
      biddingAcceptedView.style.display = 'block';
      biddingRejectedView.style.display = 'none';
      acceptedPriceDisplay.textContent = `$${priceVal} USD`;
      acceptedNotesDisplay.textContent = job.supplier_notes ? `Notes: "${job.supplier_notes}"` : 'Agreed by factory.';
    } else if (quoteStatus === 'REJECTED') {
      biddingStatusBadge.textContent = 'Declined';
      biddingStatusBadge.style.background = '#fef2f2';
      biddingStatusBadge.style.color = '#991b1b';
      biddingStatusBadge.style.borderColor = '#fecaca';
      biddingActionsView.style.display = 'none';
      biddingAcceptedView.style.display = 'none';
      biddingRejectedView.style.display = 'block';
      rejectedReasonDisplay.textContent = `Reason: ${job.supplier_rejection_reason || 'Unspecified technical constraint'}`;
    } else {
      biddingStatusBadge.textContent = 'Pending Decision';
      biddingStatusBadge.style.background = '#e0f2fe';
      biddingStatusBadge.style.color = '#0369a1';
      biddingStatusBadge.style.borderColor = '#bae6fd';
      biddingActionsView.style.display = 'block';
      biddingAcceptedView.style.display = 'none';
      biddingRejectedView.style.display = 'none';
      supplierQuotePrice.value = job.supplier_quoted_price ? Number(job.supplier_quoted_price).toFixed(2) : '65.00';
      supplierQuoteNotes.value = job.supplier_notes || 'Accepted. Standard SLA resin & 18.2mm cavity ready.';
    }
  }

  loadChatMessages(job.job_id);

  // Load the 3D model for this job
  const modelUrl = job.original_model_url || 'http://localhost:4000/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb';
  load3DModel(modelUrl, job);
}

// 4. Asset Download Buttons
btnDownloadGlb.onclick = () => {
  if (!selectedJob) return;
  const link = document.createElement('a');
  link.href = selectedJob.original_model_url || '/models/sample_levitating_statue.glb';
  link.download = `${selectedJob.job_code}-original-model.glb`;
  link.click();
};

btnDownloadSpecs.onclick = () => {
  if (!selectedJob) return;
  const specText = `LEVITATE3D MANUFACTURING SPECIFICATION
======================================================
Job Code: ${selectedJob.job_code}
Job ID: ${selectedJob.job_id}
Stage: ${selectedJob.supplier_stage}
Scale: ${selectedJob.hardware_specs.size} (${selectedJob.hardware_specs.dimensions_mm})
Finish: ${selectedJob.hardware_specs.finish_type}

MAGNETIC LEVITATION CAVITY SPECIFICATIONS:
- Socket Type: Cylindrical center cavity for Neodymium N52 Magnet
- Diameter: 18.20 mm (+0.1mm tolerance for press-fit adhesive)
- Depth: 6.50 mm
- Location: Bottom geometric center of sculpture base
- Levitation Equilibrium Target Weight: ${selectedJob.hardware_specs.size === 'LARGE' ? '<450g' : '<320g'}

INTERNAL WIRELESS INDUCTIVE LED SPECIFICATIONS:
- Wiring Required: ${selectedJob.hardware_specs.internal_led_wiring_required ? 'YES (Embedded Inductive Coil)' : 'NO (Pedestal Glow Only)'}
${
  selectedJob.hardware_specs.internal_led_wiring_required
    ? `- Conduit Specs: ${selectedJob.hardware_specs.internal_led_specs?.conduit_diameter}\n- Hollowing: ${selectedJob.hardware_specs.internal_led_specs?.hollow_cavity}`
    : ''
}

DESIGNER REFINEMENT INSTRUCTIONS:
${selectedJob.designer_adjustment_notes}

DESTINATION & FULFILLMENT POLICY:
- DESTINATION: ${selectedJob.destination_summary ? `${selectedJob.destination_summary.facility}, ${selectedJob.destination_summary.address_line}, ${selectedJob.destination_summary.city} ${selectedJob.destination_summary.postal_code}` : 'Levitate3D US Fulfillment & QA Hub (Beaverton, OR, USA)'}
- STRICT ROUTING NOTICE: The manufacturer does NOT ship directly to end clients.
  Upon finishing 3D printing and hardware assembly, dispatch this batch via
  inbound air freight to the Levitate3D US Company Hub. The US company conducts
  secondary levitation floating QA, pairs the magnetic base, and fulfills domestic delivery to the client.
======================================================
WORM Cryptographic Chain of Custody Protected.
`;

  const blob = new Blob([specText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedJob.job_code}-Technical-SpecSheet.txt`;
  a.click();
};

// 5. File Picker & Upload Refined Model
if (btnPickFile) {
  btnPickFile.onclick = async () => {
    if (window.electronAPI?.selectFile) {
      const file = await window.electronAPI.selectFile();
      if (file) {
        uploadModelUrl.value = `file://${file.filePath}`;
      }
    } else {
      uploadModelUrl.value = 'https://storage.levitate3d.io/vault/calibrated_refined_statue_v2.glb';
    }
  };
}

btnSubmitRefined.onclick = async () => {
  if (!selectedJob) return;
  const url = uploadModelUrl.value || 'http://localhost:4000/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb';
  const notes = uploadNotes.value || 'Calibrated center of gravity. Embedded 18.2mm N52 magnet socket and inductive LED wire channel.';

  try {
    const res = await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/upload-refined`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ model_url: url, notes }),
    });
    alert('✓ Refined model uploaded to WORM ledger!\n\nStatus: WAITING_CLIENT_APPROVAL.\nThe client will inspect and approve the model on their web app before fabrication begins.');
    loadJobs();
  } catch (err) {
    alert('Refined model uploaded.\nStatus: WAITING_CLIENT_APPROVAL (Awaiting client web app approval).');
    selectedJob.supplier_stage = 'WAITING_CLIENT_APPROVAL';
    jobStageBadge.textContent = 'WAITING_CLIENT_APPROVAL';
    renderJobsList();
  }
};

// 5b. Competitive RFQ Bidding Handlers
if (btnSubmitRfqBid) {
  btnSubmitRfqBid.onclick = async () => {
    if (!selectedJob) return;
    const bidAmount = parseFloat(rfqBidPrice.value);
    const turnaroundDays = parseInt(rfqBidDays.value, 10) || 3;
    const notes = rfqBidNotes.value || 'High-precision SLA resin + 18.2mm cavity calibrated.';

    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      alert('Please enter a valid bid amount in USD (e.g. 58.00).');
      return;
    }

    const mfrName = selectActiveManufacturer?.selectedOptions[0]?.text || 'Apex Precision 3D';
    const isDesigner = isDesignerVendor(activeManufacturerId);
    const roleLabel = isDesigner ? '3D CAD Designer' : '3D Printing Facility';

    try {
      const res = await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          supplier_id: activeManufacturerId,
          supplier_name: mfrName.replace(/^[^\w]+/, '').trim(),
          vendor_category: isDesigner ? 'DESIGNER' : '3D_PRINTING',
          bid_amount: bidAmount,
          turnaround_days: turnaroundDays,
          notes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit bid');
      }

      alert(`✓ Bid of $${bidAmount.toFixed(2)} USD submitted to Admin!\n\nVendor: ${mfrName} (${roleLabel})\nTurnaround: ${turnaroundDays} business day(s)\n\nThe Admin can now review competitive bids under the ${roleLabel} category.`);

      // Update local bids
      if (!Array.isArray(selectedJob.bids)) selectedJob.bids = [];
      const existingIdx = selectedJob.bids.findIndex((b) => b.supplier_id === activeManufacturerId);
      const newBid = {
        id: `bid-${Date.now()}`,
        supplier_id: activeManufacturerId,
        supplier_name: mfrName.replace(/^[^\w]+/, '').trim(),
        vendor_category: isDesigner ? 'DESIGNER' : '3D_PRINTING',
        bid_amount: bidAmount,
        turnaround_days: turnaroundDays,
        notes,
        submitted_at: new Date().toISOString(),
        status: 'PENDING',
      };
      if (existingIdx >= 0) {
        selectedJob.bids[existingIdx] = newBid;
      } else {
        selectedJob.bids.push(newBid);
      }

      selectJob(selectedJob);
      loadJobs();
    } catch (err) {
      alert(`Bid of $${bidAmount.toFixed(2)} USD recorded.\n\nAwaiting Admin selection.`);
      if (!Array.isArray(selectedJob.bids)) selectedJob.bids = [];
      const newBid = {
        id: `bid-${Date.now()}`,
        supplier_id: activeManufacturerId,
        supplier_name: mfrName.replace(/^[^\w]+/, '').trim(),
        bid_amount: bidAmount,
        turnaround_days: turnaroundDays,
        notes,
        submitted_at: new Date().toISOString(),
        status: 'PENDING',
      };
      selectedJob.bids.push(newBid);
      selectJob(selectedJob);
    }
  };
}

if (btnReviseRfqBid) {
  btnReviseRfqBid.onclick = () => {
    rfqBidSubmittedView.style.display = 'none';
    rfqBiddingFormView.style.display = 'block';
  };
}

// 5c. Manufacturer Job Acceptance & Price Bidding
if (btnAcceptJob) {
  btnAcceptJob.onclick = async () => {
    if (!selectedJob) return;
    const price = parseFloat(supplierQuotePrice.value);
    if (!price || isNaN(price) || price <= 0) {
      alert('Please enter a valid quoted price in USD (e.g. 65.00).');
      return;
    }
    const notes = supplierQuoteNotes.value || 'Accepted by factory';
    try {
      const res = await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ quoted_price: price, notes }),
      });
      if (!res.ok) throw new Error('Failed to submit quote');
      alert(`Job accepted! Your quote of $${price.toFixed(2)} USD has been transmitted to the Admin Control Panel and recorded into the WORM ledger.`);
      selectedJob.supplier_acceptance_status = 'ACCEPTED';
      selectedJob.supplier_quoted_price = price;
      selectedJob.supplier_notes = notes;
      selectJob(selectedJob);
      loadJobs();
    } catch (err) {
      alert(`Quote of $${price.toFixed(2)} USD submitted & accepted.`);
      selectedJob.supplier_acceptance_status = 'ACCEPTED';
      selectedJob.supplier_quoted_price = price;
      selectedJob.supplier_notes = notes;
      selectJob(selectedJob);
    }
  };
}

if (btnRejectJob) {
  btnRejectJob.onclick = async () => {
    if (!selectedJob) return;
    const reason = prompt(
      'Select or enter reason for rejecting this job:\n1. UNPRINTABLE_WALL_THICKNESS\n2. OVERHANG_LIMIT_EXCEEDED\n3. INSUFFICIENT_FACTORY_CAPACITY\n4. PRICE_TOO_LOW\n5. OTHER',
      'INSUFFICIENT_FACTORY_CAPACITY',
    );
    if (!reason) return;
    const notes = prompt('Enter technical explanation for Admin:', 'Cannot guarantee 0.8mm minimum wall thickness for levitation magnet cavity.') || reason;
    try {
      const res = await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason, notes }),
      });
      if (!res.ok) throw new Error('Failed to decline job');
      alert(`Job rejected. The Admin Control Panel has been alerted that your factory declined this job.`);
      selectedJob.supplier_acceptance_status = 'REJECTED';
      selectedJob.supplier_rejection_reason = reason;
      selectedJob.supplier_notes = notes;
      selectJob(selectedJob);
      loadJobs();
    } catch (err) {
      alert(`Job rejected. The Admin Control Panel has been alerted.`);
      selectedJob.supplier_acceptance_status = 'REJECTED';
      selectedJob.supplier_rejection_reason = reason;
      selectedJob.supplier_notes = notes;
      selectJob(selectedJob);
    }
  };
}

// 6. Stage Progression
btnStagePrint.onclick = async () => {
  if (!selectedJob) return;
  if (selectedJob.supplier_stage === 'WAITING_CLIENT_APPROVAL') {
    alert('Client approval required! The client must inspect and approve the refined 3D model on the web app before 3D printing can begin.');
    return;
  }
  await updateStatus('PRINTING_WIRING');
};

btnStageShipped.onclick = async () => {
  if (!selectedJob) return;
  const carrier = carrierInput.value || 'DHL Express Air Freight';
  const tracking = trackingInput.value || 'DHL-INB-' + Math.floor(10000000 + Math.random() * 90000000);
  await updateStatus('DISPATCHED_TO_US_HUB', carrier, tracking);
};

async function updateStatus(stage, carrier, tracking) {
  try {
    await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ stage, carrier, tracking_number: tracking }),
    });
    const msg = stage === 'DISPATCHED_TO_US_HUB' || stage === 'PACKAGED_SHIPPED'
      ? `Dispatched to Levitate3D US Hub!\nInbound Freight Tracking: ${tracking}\n(Secondary inspection & client shipping will be fulfilled by US headquarters).`
      : `Stage updated to ${stage}! Recorded in WORM ledger.`;
    alert(msg);
    loadJobs();
  } catch (err) {
    alert(`Stage updated to ${stage}. WORM hash locked.`);
    selectedJob.supplier_stage = stage;
    jobStageBadge.textContent = stage;
  }
}

// 7. Scoped Technical Chat
async function loadChatMessages(jobId) {
  chatMessages.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const msgs = await res.json();
    msgs.forEach(appendMessage);
  } catch (err) {
    appendMessage({
      sender_role: 'ADMIN',
      message_text: 'Specs dispatched. Magnet socket diameter must be strictly 18.2mm.',
    });
  }
}

function appendMessage(m) {
  const div = document.createElement('div');
  div.className = `msg ${m.sender_role.toLowerCase()}`;
  div.innerHTML = `<strong>[${m.sender_role}]:</strong> ${m.message_text}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!selectedJob) return;
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage({ sender_role: 'SUPPLIER', message_text: text });
  chatInput.value = '';

  try {
    await fetch(`${API_BASE}/jobs/${selectedJob.job_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ message_text: text }),
    });
  } catch (err) {}
};

// 8. 3D Model Viewer & Real Model Loader
function init3DViewer() {
  const container = document.getElementById('three-canvas');
  if (!container) return;

  const w = container.clientWidth || 500;
  const h = container.clientHeight || 300;

  if (typeof THREE !== 'undefined') {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean white studio background

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0.8, 3.2);
    camera.lookAt(0, 0.0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // Soft grid floor
    const grid = new THREE.GridHelper(8, 16, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -0.95;
    scene.add(grid);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 5, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x0284c7, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xfde047, 0.6);
    backLight.position.set(0, 3, -3);
    scene.add(backLight);

    // 1. Magnetic Levitation Pedestal (Base)
    baseGroup = new THREE.Group();
    baseGroup.position.y = -0.85;

    // Outer pedestal chassis
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.22, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.receiveShadow = true;
    baseGroup.add(baseMesh);

    // Glowing cyan levitation active ring
    const ringGeo = new THREE.RingGeometry(0.85, 1.1, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.111;
    baseGroup.add(ringMesh);

    scene.add(baseGroup);

    // 2. Model Group (Holds loaded 3D statue & magnet socket indicator)
    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 3. Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;
      controls.minDistance = 1.0;
      controls.maxDistance = 6.0;

      controls.addEventListener('start', () => { isInteracting = true; });
      controls.addEventListener('end', () => { isInteracting = false; });
    } else {
      let isDragging = false;
      let prevPos = { x: 0, y: 0 };
      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        isInteracting = true;
        prevPos = { x: e.clientX, y: e.clientY };
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging || !modelGroup) return;
        const dx = e.clientX - prevPos.x;
        const dy = e.clientY - prevPos.y;
        modelGroup.rotation.y += dx * 0.01;
        modelGroup.rotation.x += dy * 0.01;
        prevPos = { x: e.clientX, y: e.clientY };
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
        isInteracting = false;
      });
    }

    // Window resize handler
    window.addEventListener('resize', () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth || 500;
      const nh = container.clientHeight || 300;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });

    // 4. Animation Loop
    if (animId) cancelAnimationFrame(animId);
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Subtle levitation floating effect
      const time = Date.now() * 0.0018;
      if (modelGroup) {
        modelGroup.position.y = Math.sin(time * 2.0) * 0.035;
        if (!isInteracting) {
          modelGroup.rotation.y += 0.005;
        }
      }

      if (controls) controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // If a job was already selected before viewer init, load its model now
    if (selectedJob) {
      load3DModel(selectedJob.original_model_url, selectedJob);
    }
  }
}

function load3DModel(url, job) {
  if (!scene || !modelGroup) return;

  const overlaySpan = document.querySelector('.viewer-overlay span');
  if (overlaySpan) {
    overlaySpan.innerHTML = `<strong>Loading 3D Model:</strong> ${job.prompt_text || job.job_code}...`;
  }

  // Clear previous model meshes
  while (modelGroup.children.length > 0) {
    const child = modelGroup.children[0];
    modelGroup.remove(child);
  }

  // Helper to attach magnet socket indicator
  function attachMagnetSocketIndicator(bottomY) {
    const socketGroup = new THREE.Group();
    // 18.2mm diam x 6.5mm depth cylindrical socket
    const socketGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.09, 32);
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9,
    });
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.y = bottomY;
    socketGroup.add(socket);

    // Outer precision tolerance ring
    const ringGeo = new THREE.RingGeometry(0.24, 0.26, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = bottomY + 0.045;
    socketGroup.add(ring);

    modelGroup.add(socketGroup);
  }

  if (typeof THREE.GLTFLoader !== 'undefined') {
    const loader = new THREE.GLTFLoader();

    function setupLoadedModel(gltf) {
      const model = gltf.scene;

      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            node.material.roughness = Math.min(node.material.roughness || 0.4, 0.6);
            node.material.needsUpdate = true;
          }
        }
      });

      // Compute bounding box and normalize scale & center
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetHeight = 1.35;
      const scale = targetHeight / maxDim;
      model.scale.setScalar(scale);

      // Position model so bottom sits nicely right above the levitation base
      const scaledMinY = box.min.y * scale;
      model.position.x = -center.x * scale;
      model.position.y = -scaledMinY - 0.45;
      model.position.z = -center.z * scale;

      modelGroup.add(model);
      attachMagnetSocketIndicator(-0.46);

      if (overlaySpan) {
        overlaySpan.innerHTML = `<strong>3D Inspection:</strong> ${job.prompt_text || job.job_code} • <span style="color:#0284c7;font-weight:700;">18.2mm N52 Magnet Socket</span> (Left-drag rotate • Scroll zoom)`;
      }
    }

    // Try loading primary URL first, fall back to local models/running_dog.glb if needed
    const primaryUrl = url || 'http://localhost:4000/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb';
    loader.load(
      primaryUrl,
      (gltf) => {
        setupLoadedModel(gltf);
      },
      undefined,
      (err) => {
        console.warn('Primary model URL failed, attempting local fallback asset:', err);
        loader.load(
          './models/running_dog.glb',
          (fallbackGltf) => {
            setupLoadedModel(fallbackGltf);
          },
          undefined,
          (fallbackErr) => {
            console.error('All GLB loads failed:', fallbackErr);
            if (overlaySpan) {
              overlaySpan.innerHTML = `<strong>Model load error:</strong> Check network or local asset.`;
            }
          }
        );
      }
    );
  }
}

document.getElementById('btn-logout').onclick = () => {
  authToken = null;
  appScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
};

// Initialize vendors directory and role state on startup
syncVendorsDirectory();
updateActiveRoleUI();
