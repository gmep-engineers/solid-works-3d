import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  RotateCcw,
  Eye,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle2,
  Cpu,
  Download,
  Calculator,
  Save,
  FolderOpen
} from 'lucide-react';
import ForgeProgressBar from './ForgeProgressBar';

export default function ForgeViewport({
  sessionId,
  sessionState = null,
  modelVersion = 0,
  materialId = 'bronze_infused_steel',
  onMaterialChange = null,
  isHollowed = false,
  slicePlaneZ = null,
  onFaceSelect = null,
  isProcessing = false,
  progress = 0,
  progressStage = '',
  progressTitle = '',
  onModelLoaded = null,
  onTransferToQuote = null,
  onSaveProject = null,
  onLoadProject = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const meshGroupRef = useRef(null);
  const sliceHelperRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('solid'); // 'solid' | 'xray' | 'wireframe'
  const [selectedFaceLabel, setSelectedFaceLabel] = useState(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(70, 60, 90);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Restrict below ground
    controlsRef.current = controls;

    // Lighting (Studio Metal Rig)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    keyLight.position.set(60, 100, 60);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.4);
    fillLight.position.set(-60, 50, -40);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(0, -20, -70);
    scene.add(rimLight);

    // Ground Bed & Industrial Grid
    const gridHelper = new THREE.GridHelper(160, 32, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Sintering Build Plate Platform
    const plateGeo = new THREE.CylinderGeometry(55, 55, 1.2, 48);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.8
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = -0.6;
    plateMesh.receiveShadow = true;
    scene.add(plateMesh);

    // Mesh container group
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Slicing plane visualization helper
    const slicePlaneGeo = new THREE.PlaneGeometry(80, 80);
    const slicePlaneMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const slicePlane = new THREE.Mesh(slicePlaneGeo, slicePlaneMat);
    slicePlane.rotation.x = Math.PI / 2;
    slicePlane.visible = false;
    scene.add(slicePlane);
    sliceHelperRef.current = slicePlane;

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Slice Plane Visualizer
  useEffect(() => {
    if (!sliceHelperRef.current) return;
    if (slicePlaneZ !== null && slicePlaneZ !== undefined) {
      sliceHelperRef.current.position.y = slicePlaneZ;
      sliceHelperRef.current.visible = true;
    } else {
      sliceHelperRef.current.visible = false;
    }
  }, [slicePlaneZ]);

  // Load Model from backend session
  useEffect(() => {
    if (!sessionId || !meshGroupRef.current || !sceneRef.current) return;

    setIsLoading(true);
    const loader = new GLTFLoader();
    const url = `/api/forge/sessions/${sessionId}/model.glb?v=${modelVersion}_${Date.now()}`;

    loader.load(
      url,
      (gltf) => {
        // Clear previous children
        while (meshGroupRef.current.children.length > 0) {
          const obj = meshGroupRef.current.children[0];
          meshGroupRef.current.remove(obj);
        }

        const model = gltf.scene;

        // Apply metal PBR material
        applyMaterialToModel(model, materialId, viewMode);

        // Center on X/Y and place bottom on Z=0
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -box.min.y;
        model.updateMatrixWorld(true);

        meshGroupRef.current.add(model);
        setIsLoading(false);
        if (onModelLoaded) onModelLoaded();

        // Show brief visual feedback toast
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 2200);

        // Fit camera smoothly
        fitCameraToObject(model);
      },
      undefined,
      (err) => {
        console.error('Error loading ForgeAI GLB:', err);
        setIsLoading(false);
      }
    );
  }, [sessionId, modelVersion]);

  // Re-apply materials whenever materialId or viewMode changes
  useEffect(() => {
    if (!meshGroupRef.current) return;
    meshGroupRef.current.traverse((child) => {
      if (child.isMesh) {
        child.material = getPbrMaterial(materialId, viewMode);
      }
    });
  }, [materialId, viewMode]);

  const applyMaterialToModel = (model, matId, vMode) => {
    const mat = getPbrMaterial(matId, vMode);
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  const getPbrMaterial = (matId, vMode) => {
    let color = 0xc29b38; // Antique Bronze default
    let metalness = 0.92;
    let roughness = 0.35;

    if (matId === 'ss_316l') {
      color = 0xe2e8f0; // 316L Stainless Steel
      metalness = 0.96;
      roughness = 0.22;
    } else if (matId === 'ti_6al_4v') {
      color = 0x94a3b8; // Ti6Al4V Titanium
      metalness = 0.88;
      roughness = 0.32;
    }

    if (vMode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 0.38,
        transmission: 0.4,
        ior: 1.4,
        depthWrite: false,
        side: THREE.DoubleSide
      });
    } else if (vMode === 'wireframe') {
      return new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        wireframe: true,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3
      });
    }

    // Solid PBR metal
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness,
      roughness: roughness,
      envMapIntensity: 1.2
    });
  };

  const fitCameraToObject = (object) => {
    if (!cameraRef.current || !controlsRef.current || !object) return;
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!maxDim || isNaN(maxDim) || maxDim <= 0) return;

    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;
    cameraZ = Math.max(cameraZ, 45);

    cameraRef.current.position.set(cameraZ * 0.8, cameraZ * 0.6, cameraZ);
    cameraRef.current.lookAt(center.x, center.y, center.z);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    if (meshGroupRef.current) {
      fitCameraToObject(meshGroupRef.current);
    }
  };

  const handleFacePick = (faceKey) => {
    setSelectedFaceLabel(faceKey);
    if (onFaceSelect) onFaceSelect(faceKey);
  };

  return (
    <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col ${className}`}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing relative" />

      {/* 3D CAD & AI Feature Generation Progress Bar HUD Overlay */}
      {(isProcessing || isLoading) && (
        <ForgeProgressBar
          isProcessing={true}
          progress={progress > 0 ? progress : (isLoading ? 92 : 20)}
          stage={progressStage || (isLoading ? 'Tessellating & streaming 3D GLB buffer...' : 'Executing OpenCASCADE CAD pipeline...')}
          title={progressTitle || 'Synthesizing 3D Feature'}
          variant="hud"
        />
      )}

      {/* 3D Geometry Updated Feedback Toast */}
      {justUpdated && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-950 font-extrabold px-4 py-1.5 rounded-full text-xs shadow-2xl flex items-center gap-2 z-30 pointer-events-none animate-bounce border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>3D Geometry Updated</span>
        </div>
      )}

      {/* Empty State Overlay when no model is active */}
      {!sessionId && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-4">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center max-w-sm shadow-2xl space-y-3 pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Empty Build Plate</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                No 3D model loaded. Enter a concept prompt or CAD command on the left to synthesize a metal part.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        {/* Left: View Mode Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
          <button
            onClick={() => setViewMode('solid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'solid'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            PBR Metal
          </button>
          <button
            onClick={() => setViewMode('xray')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'xray'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Inspect hollow cavity & powder drain channel"
          >
            <Eye className="w-3.5 h-3.5" />
            Hollow X-Ray
          </button>
          <button
            onClick={() => setViewMode('wireframe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'wireframe'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Topology
          </button>
        </div>

        {/* Center: Metal Material Alloy Selector */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
          {[
            { id: 'bronze_infused_steel', label: 'Bronze Infused Steel', color: '#c29b38' },
            { id: 'ss_316l', label: '316L Steel', color: '#e2e8f0' },
            { id: 'ti_6al_4v', label: 'Titanium', color: '#94a3b8' }
          ].map((mat) => (
            <button
              key={mat.id}
              onClick={() => onMaterialChange && onMaterialChange(mat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                materialId === mat.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: mat.color }} />
              {mat.label}
            </button>
          ))}
        </div>

        {/* Right: Downloads & Reset Camera */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
          {sessionState?.engine_used && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shadow-sm ${
              sessionState.engine_used === 'tripo3d'
                ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                : sessionState.engine_used === 'gemini_cad'
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
            }`}>
              {sessionState.engine_used === 'tripo3d' ? '✨ Tripo3D Mesh' :
               sessionState.engine_used === 'gemini_cad' ? '⚡ Gemini CAD' : '📐 TitanForge CAD'}
            </span>
          )}
          {sessionId && (
            <>
              <a
                href={`/api/forge/sessions/${sessionId}/download/stl`}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Download 3D Printable STL"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                STL
              </a>
              <a
                href={`/api/forge/sessions/${sessionId}/download/glb`}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Download Binary GLB"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                GLB
              </a>
              {onSaveProject && (
                <button
                  type="button"
                  onClick={onSaveProject}
                  disabled={isProcessing}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Save current design to project library"
                >
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save</span>
                </button>
              )}
              {onLoadProject && (
                <button
                  type="button"
                  onClick={onLoadProject}
                  disabled={isProcessing}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Load saved project design"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load</span>
                </button>
              )}
              {onTransferToQuote && (
                <button
                  type="button"
                  onClick={onTransferToQuote}
                  disabled={isProcessing}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Transfer 3D model to Quote & DFM tab for instant metal pricing"
                >
                  <Calculator className="w-3.5 h-3.5 text-slate-950" />
                  <span>Quote & DFM →</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Face Selection Bar for SolidWorks Extrude/Cut */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
          <span className="text-[11px] text-slate-400 font-mono">Select Face:</span>
          {['TOP', 'BOTTOM', 'FRONT'].map((face) => (
            <button
              key={face}
              onClick={() => handleFacePick(face)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                selectedFaceLabel === face
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {face}
            </button>
          ))}
        </div>

        {isHollowed && (
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-300">
              SLM Powder Port Active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
