import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  Eye,
  Box,
  AlertTriangle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Compass,
  Lightbulb,
  Sun,
  Sparkles,
  Move,
  Crosshair,
  SlidersHorizontal,
  RotateCcw,
  Check
} from 'lucide-react';

const MATERIAL_PREVIEWS = {
  // DMLS Metals
  ti_6al_4v: { color: 0x94a3b8, metalness: 0.75, roughness: 0.35, clearcoat: 0.3, transparent: false, name: 'Titanium Ti-6Al-4V' },
  ss_316l: { color: 0xcbd5e1, metalness: 0.85, roughness: 0.25, clearcoat: 0.4, transparent: false, name: 'Stainless Steel 316L' },
  alsi10mg: { color: 0xe2e8f0, metalness: 0.65, roughness: 0.40, clearcoat: 0.2, transparent: false, name: 'Aluminum AlSi10Mg' },
  inconel_718: { color: 0x64748b, metalness: 0.90, roughness: 0.22, clearcoat: 0.3, transparent: false, name: 'Inconel 718' },
  ss_17_4ph: { color: 0xa1a1aa, metalness: 0.80, roughness: 0.28, clearcoat: 0.3, transparent: false, name: 'Stainless 17-4 PH' },
  copper_cuni2sicr: { color: 0xd97706, metalness: 0.82, roughness: 0.28, clearcoat: 0.4, transparent: false, name: 'Copper CuNi2SiCr' },
  scalmalloy: { color: 0x93c5fd, metalness: 0.70, roughness: 0.38, clearcoat: 0.3, transparent: false, name: 'Scalmalloy Aerospace' },

  // SLA Optical Resins for Transparent Custom Lights
  sla_ultraclear: {
    color: 0xdbeafe,
    metalness: 0.05,
    roughness: 0.04,
    transparent: true,
    opacity: 0.32,
    isTransparent: true,
    defaultLightColor: 0xffedd5,
    name: 'UltraClear Optical Resin (92% Clear)'
  },
  sla_frosted_diffuser: {
    color: 0xf8fafc,
    metalness: 0.02,
    roughness: 0.45,
    transparent: true,
    opacity: 0.65,
    isTransparent: true,
    defaultLightColor: 0xffedd5,
    name: 'Frosted Opal Diffuser Resin'
  },
  sla_amber_crystal: {
    color: 0xf59e0b,
    metalness: 0.06,
    roughness: 0.08,
    transparent: true,
    opacity: 0.48,
    isTransparent: true,
    defaultLightColor: 0xfbbf24,
    name: 'Amber Crystal Vintage Tint'
  },
  sla_smoked_obsidian: {
    color: 0x334155,
    metalness: 0.12,
    roughness: 0.12,
    transparent: true,
    opacity: 0.58,
    isTransparent: true,
    defaultLightColor: 0x38bdf8,
    name: 'Smoked Obsidian Translucent'
  },
  sla_cyan_luminescent: {
    color: 0x06b6d4,
    metalness: 0.08,
    roughness: 0.06,
    transparent: true,
    opacity: 0.42,
    isTransparent: true,
    defaultLightColor: 0x22d3ee,
    name: 'Cyan Luminescent Edge-Glow'
  },
  hybrid_metal_light: {
    color: 0x38bdf8,
    metalness: 0.40,
    roughness: 0.22,
    transparent: true,
    opacity: 0.52,
    isTransparent: true,
    defaultLightColor: 0xffedd5,
    name: 'Hybrid Metal + Optical Luminaire'
  }
};

export default function CadViewer({
  modelUrl,
  materialId = 'ti_6al_4v',
  illumination = 'none',
  lightCoords: propLightCoords,
  onLightCoordsChange,
  onSwitchMaterial,
  onToggleIllumination,
  onCaptureReady,
  thinFeatures = [],
  dfmStatus = 'PASS',
  bbox = null,
  volume = null,
  className = ''
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const transformControlsRef = useRef(null);
  const meshGroupRef = useRef(null);
  const modelContainerRef = useRef(null);
  const heatmapGroupRef = useRef(null);
  const bboxHelperRef = useRef(null);
  const luminaireLightRef = useRef(null);
  const luminaireMeshRef = useRef(null);

  const [wireframe, setWireframe] = useState(false);
  const [showEdges, setShowEdges] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBbox, setShowBbox] = useState(true);
  const [isBboxHovered, setIsBboxHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lampLightOn, setLampLightOn] = useState(true);
  const [lampColor, setLampColor] = useState('warm'); // 'warm' | 'amber' | 'cyan' | 'cool'

  // Interactive 3D Light Gizmo & Coordinates state
  const [showLightGizmo, setShowLightGizmo] = useState(true);
  const [showCoordPanel, setShowCoordPanel] = useState(false);
  const [localLightPos, setLocalLightPos] = useState({ x: 0, y: 25, z: 0 });
  const [modelBounds, setModelBounds] = useState({
    xRange: [-40, 40],
    yRange: [0, 70],
    zRange: [-40, 40],
    centroidY: 25
  });

  const lightPos = propLightCoords || localLightPos;

  // Viewport high-resolution snapshot capture
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    } catch (e) {
      console.warn('Viewport snapshot capture failed:', e);
      return null;
    }
  };

  useEffect(() => {
    if (onCaptureReady) {
      onCaptureReady(captureSnapshot);
    }
  }, [onCaptureReady]);

  // Setup Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(120, 100, 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 800;
    controls.minDistance = 10;
    controlsRef.current = controls;

    // High-Contrast Studio CAD Lighting (SolidWorks / NX Studio style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(120, 180, 140);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-140, 100, -100);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.9);
    topLight.position.set(0, 190, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(0, -50, -150);
    scene.add(rimLight);

    // Build Plate Grid (DMLS 250x250mm plate preview)
    const grid = new THREE.GridHelper(250, 25, 0x06b6d4, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    // Internal Luminaire Core Light (PointLight representing internal LED emitter)
    const luminaireLight = new THREE.PointLight(0xffedd5, 0, 350, 1.6);
    luminaireLight.position.set(lightPos.x, lightPos.y, lightPos.z);
    scene.add(luminaireLight);
    luminaireLightRef.current = luminaireLight;

    // Physical Internal LED Light Core (Visible inside transparent optical geometry)
    const ledCoreGeo = new THREE.SphereGeometry(3.5, 24, 24);
    const ledCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.95
    });
    const ledCoreMesh = new THREE.Mesh(ledCoreGeo, ledCoreMat);
    ledCoreMesh.position.set(lightPos.x, lightPos.y, lightPos.z);
    ledCoreMesh.visible = false;
    scene.add(ledCoreMesh);
    luminaireMeshRef.current = ledCoreMesh;

    // TransformControls: Interactive 3D Drag Gizmo for the custom light
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.65;
    transformControls.setMode('translate');
    transformControls.space = 'world';

    transformControls.addEventListener('dragging-changed', (event) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = !event.value;
      }
    });

    transformControls.addEventListener('change', () => {
      if (luminaireMeshRef.current && luminaireLightRef.current) {
        luminaireLightRef.current.position.copy(luminaireMeshRef.current.position);
        const newPos = {
          x: Number(luminaireMeshRef.current.position.x.toFixed(1)),
          y: Number(luminaireMeshRef.current.position.y.toFixed(1)),
          z: Number(luminaireMeshRef.current.position.z.toFixed(1))
        };
        setLocalLightPos(newPos);
        if (onLightCoordsChange) {
          onLightCoordsChange(newPos);
        }
      }
    });

    const helper = transformControls.getHelper();
    helper.visible = false;
    scene.add(helper);
    transformControls.attach(ledCoreMesh);
    transformControlsRef.current = transformControls;

    // Groups (Root meshGroup holds both the CAD model and the DFM markers)
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const modelContainer = new THREE.Group();
    meshGroup.add(modelContainer);
    modelContainerRef.current = modelContainer;

    const heatmapGroup = new THREE.Group();
    meshGroup.add(heatmapGroup);
    heatmapGroupRef.current = heatmapGroup;

    // Render loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
      }
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update light gizmo helper visibility
  useEffect(() => {
    if (transformControlsRef.current) {
      const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
      const isTransparent = Boolean(matSpec.isTransparent || matSpec.transparent);
      const isIlluminationActive = Boolean(
        (illumination && illumination !== 'none') ||
        (isTransparent && lampLightOn)
      );

      const helper = transformControlsRef.current.getHelper();
      const shouldBeVisible = showLightGizmo && isIlluminationActive;
      helper.visible = shouldBeVisible;
      transformControlsRef.current.enabled = shouldBeVisible;
    }
  }, [showLightGizmo, materialId, illumination, lampLightOn]);

  // Synchronize external lightCoords prop if provided
  useEffect(() => {
    if (propLightCoords) {
      setLocalLightPos(propLightCoords);
      if (luminaireMeshRef.current) {
        luminaireMeshRef.current.position.set(propLightCoords.x, propLightCoords.y, propLightCoords.z);
      }
      if (luminaireLightRef.current) {
        luminaireLightRef.current.position.set(propLightCoords.x, propLightCoords.y, propLightCoords.z);
      }
    }
  }, [propLightCoords]);

  // Load Model Geometry (OBJ or STL)
  useEffect(() => {
    const scene = sceneRef.current;
    const modelContainer = modelContainerRef.current;
    const heatmapGroup = heatmapGroupRef.current;
    const meshGroup = meshGroupRef.current;
    if (!scene || !modelContainer || !meshGroup || !modelUrl) return;

    setIsLoading(true);

    // Clean previous models
    while (modelContainer.children.length > 0) {
      const child = modelContainer.children[0];
      if (child.geometry) child.geometry.dispose();
      modelContainer.remove(child);
    }
    while (heatmapGroup.children.length > 0) {
      const child = heatmapGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      heatmapGroup.remove(child);
    }
    if (bboxHelperRef.current) {
      scene.remove(bboxHelperRef.current);
      bboxHelperRef.current = null;
    }

    const isStl = modelUrl.toLowerCase().endsWith('.stl');
    const loader = isStl ? new STLLoader() : new OBJLoader();

    loader.load(
      modelUrl,
      (geometryOrObj) => {
        let finalMesh;

        if (isStl) {
          geometryOrObj.computeVertexNormals();
          geometryOrObj.center();

          const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
          const material = new THREE.MeshPhysicalMaterial({
            color: matSpec.color,
            metalness: matSpec.metalness,
            roughness: matSpec.roughness,
            clearcoat: matSpec.clearcoat || 0.1,
            wireframe: wireframe
          });

          const mesh = new THREE.Mesh(geometryOrObj, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const edgeGeo = new THREE.EdgesGeometry(geometryOrObj, 25);
          const edgeMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 1, transparent: true, opacity: 0.35 });
          const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
          edgeLines.name = 'cadEdges';
          edgeLines.visible = showEdges;
          mesh.add(edgeLines);

          modelContainer.add(mesh);
          finalMesh = mesh;
        } else {
          // OBJ Loader
          const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
          geometryOrObj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.geometry.computeVertexNormals();

              child.material = new THREE.MeshPhysicalMaterial({
                color: matSpec.color,
                metalness: matSpec.metalness,
                roughness: matSpec.roughness,
                clearcoat: matSpec.clearcoat || 0.1,
                wireframe: wireframe
              });

              const edgeGeo = new THREE.EdgesGeometry(child.geometry, 25);
              const edgeMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 1, transparent: true, opacity: 0.35 });
              const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
              edgeLines.name = 'cadEdges';
              edgeLines.visible = showEdges;
              child.add(edgeLines);
            }
          });
          modelContainer.add(geometryOrObj);
          finalMesh = geometryOrObj;
        }

        // Center root meshGroup at origin and place base on build plate
        meshGroup.position.set(0, 0, 0);
        const box = new THREE.Box3().setFromObject(modelContainer);
        const center = new THREE.Vector3();
        box.getCenter(center);
        meshGroup.position.set(-center.x, -box.min.y, -center.z);

        // Center internal LED light and physical diode core inside model volume
        const modelHeight = box.max.y - box.min.y;
        const widthX = box.max.x - box.min.x;
        const depthZ = box.max.z - box.min.z;
        const internalCentroidY = Math.max(modelHeight * 0.45, 12);

        const initialPos = {
          x: 0,
          y: Number(internalCentroidY.toFixed(1)),
          z: 0
        };

        if (luminaireLightRef.current) {
          luminaireLightRef.current.position.set(initialPos.x, initialPos.y, initialPos.z);
        }
        if (luminaireMeshRef.current) {
          luminaireMeshRef.current.position.set(initialPos.x, initialPos.y, initialPos.z);
        }
        setLocalLightPos(initialPos);
        if (onLightCoordsChange) {
          onLightCoordsChange(initialPos);
        }

        setModelBounds({
          xRange: [Math.floor(-widthX / 2), Math.ceil(widthX / 2)],
          yRange: [0, Math.ceil(modelHeight)],
          zRange: [Math.floor(-depthZ / 2), Math.ceil(depthZ / 2)],
          centroidY: Number(internalCentroidY.toFixed(1))
        });

        // Add Bounding Box Helper
        const bboxBox = new THREE.Box3().setFromObject(meshGroup);
        const helper = new THREE.Box3Helper(bboxBox, 0x06b6d4);
        helper.visible = showBbox;
        sceneRef.current.add(helper);
        bboxHelperRef.current = helper;

        // Adjust camera distance
        const sphere = new THREE.Sphere();
        bboxBox.getBoundingSphere(sphere);
        const radius = Math.max(sphere.radius, 25);
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(radius * 1.6, radius * 1.3, radius * 1.8);
          controlsRef.current.target.set(0, radius * 0.35, 0);
          controlsRef.current.update();
        }

        // Render DFM Thin Wall Warning Markers
        if (thinFeatures && thinFeatures.length > 0) {
          const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

          thinFeatures.forEach((feat) => {
            const marker = new THREE.Mesh(sphereGeo, sphereMat);
            const pos = feat.location || [0, 0, 0];
            marker.position.set(pos[0], pos[1], pos[2]);

            const haloGeo = new THREE.RingGeometry(2.0, 2.8, 24);
            const haloMat = new THREE.MeshBasicMaterial({ color: 0xf87171, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            halo.rotation.x = Math.PI / 2;
            marker.add(halo);

            heatmapGroup.add(marker);
          });
        }

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading 3D CAD model:', err);
        setIsLoading(false);
      }
    );
  }, [modelUrl]);

  // Update Material Appearance, Internal Luminaire Emission, and Physical Glow
  useEffect(() => {
    const modelContainer = modelContainerRef.current;
    if (!modelContainer) return;

    const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
    const isTransparent = Boolean(matSpec.isTransparent || matSpec.transparent);

    // Illumination active condition:
    const isIlluminationActive = Boolean(
      (illumination && illumination !== 'none') ||
      (isTransparent && lampLightOn)
    );

    // Map illumination type to physical light spectrum
    const ILLUMINATION_SPECTRUMS = {
      warm_edison_2700k: 0xffaa33,
      architectural_4000k: 0xf1f5f9,
      smart_rgbw_touch: 0x06b6d4,
      edge_glow_white: 0xe0f2fe,
      rgbw_app: 0xd946ef
    };

    const lightHex =
      ILLUMINATION_SPECTRUMS[illumination] ||
      (lampColor === 'warm' ? 0xffaa33 : lampColor === 'amber' ? 0xf59e0b : lampColor === 'cyan' ? 0x06b6d4 : lampColor === 'magenta' ? 0xd946ef : 0xf8fafc);

    modelContainer.traverse((child) => {
      if (child.isMesh && child.name !== 'cadEdges') {
        child.material.color.setHex(matSpec.color);
        child.material.metalness = matSpec.metalness;
        child.material.wireframe = wireframe;

        if (isIlluminationActive && isTransparent) {
          // Blender-style internal emission & subsurface scattering:
          child.material.transparent = true;
          child.material.opacity = matSpec.opacity !== undefined ? matSpec.opacity : 0.45;
          child.material.depthWrite = false;
          child.material.emissive.setHex(lightHex);

          if (materialId === 'sla_frosted_diffuser') {
            child.material.emissiveIntensity = 0.88;
            child.material.roughness = 0.55;
          } else if (materialId === 'sla_ultraclear') {
            child.material.emissiveIntensity = 0.38;
            child.material.roughness = 0.05;
          } else if (materialId === 'sla_amber_crystal') {
            child.material.emissiveIntensity = 0.75;
            child.material.roughness = 0.12;
          } else if (materialId === 'sla_cyan_luminescent') {
            child.material.emissiveIntensity = 0.82;
            child.material.roughness = 0.10;
          } else if (materialId === 'sla_smoked_obsidian') {
            child.material.emissiveIntensity = 0.50;
            child.material.roughness = 0.15;
          } else {
            child.material.emissiveIntensity = 0.65;
            child.material.roughness = matSpec.roughness;
          }
        } else {
          // Opaque metal OR unlit transparent:
          child.material.transparent = Boolean(matSpec.transparent);
          child.material.opacity = matSpec.opacity !== undefined ? matSpec.opacity : 1.0;
          child.material.depthWrite = !matSpec.transparent;
          child.material.roughness = matSpec.roughness;
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0.0;
        }

        child.material.needsUpdate = true;
      }
    });

    // Control internal Luminaire PointLight and physical LED core mesh
    if (luminaireLightRef.current && luminaireMeshRef.current) {
      if (isIlluminationActive && isTransparent) {
        luminaireLightRef.current.color.setHex(lightHex);
        luminaireLightRef.current.intensity = 8.5;
        luminaireLightRef.current.visible = true;

        luminaireMeshRef.current.material.color.setHex(lightHex);
        luminaireMeshRef.current.visible = true;
      } else {
        // Occluded completely by opaque metal or light is off
        luminaireLightRef.current.intensity = 0;
        luminaireLightRef.current.visible = false;
        luminaireMeshRef.current.visible = false;
      }
    }
  }, [materialId, illumination, wireframe, lampLightOn, lampColor]);

  // Update Bounding Box visibility
  useEffect(() => {
    if (bboxHelperRef.current) {
      bboxHelperRef.current.visible = showBbox;
    }
  }, [showBbox]);

  // Update CAD Edge lines visibility
  useEffect(() => {
    if (modelContainerRef.current) {
      modelContainerRef.current.traverse((child) => {
        if (child.name === 'cadEdges') {
          child.visible = showEdges;
        }
      });
    }
  }, [showEdges]);

  // Update DFM markers visibility
  useEffect(() => {
    if (heatmapGroupRef.current) {
      heatmapGroupRef.current.visible = showHeatmap;
    }
  }, [showHeatmap]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current && meshGroupRef.current) {
      const box = new THREE.Box3().setFromObject(meshGroupRef.current);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      const radius = Math.max(sphere.radius, 25);
      cameraRef.current.position.set(radius * 1.6, radius * 1.3, radius * 1.8);
      controlsRef.current.target.set(0, radius * 0.35, 0);
      controlsRef.current.update();
    }
  };

  // Coordinate adjustments via input fields or sliders
  const handleCoordChange = (axis, rawValue) => {
    const val = parseFloat(rawValue) || 0;
    const updated = { ...lightPos, [axis]: val };
    setLocalLightPos(updated);

    if (luminaireMeshRef.current) {
      luminaireMeshRef.current.position[axis] = val;
    }
    if (luminaireLightRef.current) {
      luminaireLightRef.current.position[axis] = val;
    }
    if (onLightCoordsChange) {
      onLightCoordsChange(updated);
    }
  };

  const handleApplyPreset = (presetKey) => {
    let nextPos = { ...lightPos };
    const { xRange, yRange, zRange, centroidY } = modelBounds;

    if (presetKey === 'center') {
      nextPos = { x: 0, y: centroidY, z: 0 };
    } else if (presetKey === 'top') {
      nextPos = { x: 0, y: Number((yRange[1] * 0.85).toFixed(1)), z: 0 };
    } else if (presetKey === 'base') {
      nextPos = { x: 0, y: Number(Math.max(yRange[0] + 6, 8).toFixed(1)), z: 0 };
    } else if (presetKey === 'front') {
      nextPos = { x: 0, y: centroidY, z: Number((zRange[1] * 0.65).toFixed(1)) };
    } else if (presetKey === 'back') {
      nextPos = { x: 0, y: centroidY, z: Number((zRange[0] * 0.65).toFixed(1)) };
    } else if (presetKey === 'reset') {
      nextPos = { x: 0, y: 25, z: 0 };
    }

    setLocalLightPos(nextPos);
    if (luminaireMeshRef.current) {
      luminaireMeshRef.current.position.set(nextPos.x, nextPos.y, nextPos.z);
    }
    if (luminaireLightRef.current) {
      luminaireLightRef.current.position.set(nextPos.x, nextPos.y, nextPos.z);
    }
    if (onLightCoordsChange) {
      onLightCoordsChange(nextPos);
    }
  };

  const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
  const isTransparent = Boolean(matSpec.isTransparent || matSpec.transparent);
  const isIlluminationActive = Boolean(
    (illumination && illumination !== 'none') ||
    (isTransparent && lampLightOn)
  );

  return (
    <div className={`relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* 3D Viewport Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 min-h-[360px] relative cursor-grab active:cursor-grabbing">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-cyan-300">Rendering 3D CAD Geometry & Luminaire Engine...</span>
            </div>
          </div>
        )}

        {/* Viewport Top Bar Controls */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10 flex-wrap">
          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md ${
              wireframe
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title="Toggle Wireframe Tessellation"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>

          {/* CAD Edges toggle */}
          <button
            onClick={() => setShowEdges(!showEdges)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md ${
              showEdges
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title="Toggle CAD Feature Feature Edges"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>CAD Edges</span>
          </button>

          {/* Custom Light Drag & Coordinate Controls */}
          {isIlluminationActive && (
            <>
              {/* 3D Drag Gizmo Toggle */}
              <button
                type="button"
                onClick={() => setShowLightGizmo(!showLightGizmo)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer ${
                  showLightGizmo
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
                title="Toggle interactive 3D drag arrows gizmo to drag light directly in 3D viewport"
              >
                <Move className={`w-3.5 h-3.5 ${showLightGizmo ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{showLightGizmo ? 'Drag Gizmo: ON' : 'Drag Gizmo: OFF'}</span>
              </button>

              {/* Light Location Coordinates Inspector Button */}
              <button
                type="button"
                onClick={() => setShowCoordPanel(!showCoordPanel)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer ${
                  showCoordPanel
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
                title="Open coordinate inputs to adjust exact (X, Y, Z) light position"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Light Pos: ({lightPos.x.toFixed(0)}, {lightPos.y.toFixed(0)}, {lightPos.z.toFixed(0)})
                </span>
              </button>
            </>
          )}

          {/* Subsurface Luminescence Status / Custom Light Palette */}
          {isIlluminationActive && isTransparent ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-lg shadow-amber-950/40">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-[11px] font-mono text-amber-300 font-semibold flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                Subsurface Glow: Lit
              </span>
              <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2 ml-1">
                {[
                  { id: 'warm', hex: '#ffedd5', title: '2700K Warm Edison' },
                  { id: 'amber', hex: '#f59e0b', title: 'Amber Sunset Vintage' },
                  { id: 'cyan', hex: '#06b6d4', title: 'Neon Cyan Cyber' },
                  { id: 'cool', hex: '#ffffff', title: '4000K Pure White' },
                  { id: 'magenta', hex: '#d946ef', title: 'Magenta Mood' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLampColor(c.id)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer border ${
                      lampColor === c.id ? 'scale-125 border-white shadow-md ring-1 ring-white/60' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.title}
                  />
                ))}
              </div>
            </div>
          ) : (illumination && illumination !== 'none' && !isTransparent) ? (
            <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/50 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-amber-300 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Illumination Occluded (Watertight Metal)</span>
            </div>
          ) : null}

          {/* Bounding Box Envelope */}
          <div className="relative">
            <button
              onClick={() => setShowBbox(!showBbox)}
              onMouseEnter={() => setIsBboxHovered(true)}
              onMouseLeave={() => setIsBboxHovered(false)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer ${
                showBbox
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
              title="Toggle bounding box envelope"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Bounding Box</span>
              {bbox && (
                <span className="text-[10px] font-mono text-cyan-300/80 border-l border-cyan-500/30 pl-1.5 ml-0.5 hidden sm:inline">
                  {bbox[0]}×{bbox[1]}×{bbox[2]} mm
                </span>
              )}
            </button>

            {isBboxHovered && bbox && (
              <div className="absolute left-0 top-full mt-2 z-30 w-72 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md pointer-events-none text-left">
                <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Box className="w-3 h-3" /> 3D Bounding Envelope
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center mb-2 font-mono text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                    <div className="text-[9px] text-rose-400">X (Width)</div>
                    <div className="font-bold text-white text-[11px]">{bbox[0]} mm</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                    <div className="text-[9px] text-emerald-400">Y (Depth)</div>
                    <div className="font-bold text-white text-[11px]">{bbox[1]} mm</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                    <div className="text-[9px] text-cyan-400">Z (Height)</div>
                    <div className="font-bold text-white text-[11px]">{bbox[2]} mm</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Box Volume:</span>
                  <span className="text-white font-bold">{((bbox[0] * bbox[1] * bbox[2]) / 1000).toFixed(2)} cm³</span>
                </div>
              </div>
            )}
          </div>

          {thinFeatures && thinFeatures.length > 0 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer ${
                showHeatmap
                  ? 'bg-red-500/25 text-red-300 border border-red-500/50 animate-pulse'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
              title="Toggle thin layer / wall thickness warnings highlight"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Thin Wall Markers ({thinFeatures.length})
            </button>
          )}

          <button
            onClick={resetCamera}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all backdrop-blur-md cursor-pointer"
            title="Reset Camera View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Light Coordinate (X, Y, Z) Inspector Panel */}
        {showCoordPanel && isIlluminationActive && (
          <div className="absolute top-14 left-3 z-30 w-80 bg-slate-950/95 border border-amber-500/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-left animate-in fade-in zoom-in-95 duration-150 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Custom Light 3D Coordinates</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCoordPanel(false)}
                className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-tight">
              Drag the 3D translation gizmo arrows directly on the model or fine-tune exact millimeters below.
            </p>

            {/* X, Y, Z Coordinate Rows */}
            <div className="space-y-2 font-mono text-xs">
              {/* X Axis */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    X (Width):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCoordChange('x', lightPos.x - 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={lightPos.x}
                      onChange={(e) => handleCoordChange('x', e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1 text-center font-bold text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleCoordChange('x', lightPos.x + 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-slate-500 text-[10px]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={modelBounds.xRange[0]}
                  max={modelBounds.xRange[1]}
                  step="0.5"
                  value={lightPos.x}
                  onChange={(e) => handleCoordChange('x', e.target.value)}
                  className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Y Axis */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Y (Height):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCoordChange('y', lightPos.y - 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={lightPos.y}
                      onChange={(e) => handleCoordChange('y', e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1 text-center font-bold text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleCoordChange('y', lightPos.y + 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-slate-500 text-[10px]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={modelBounds.yRange[0]}
                  max={modelBounds.yRange[1]}
                  step="0.5"
                  value={lightPos.y}
                  onChange={(e) => handleCoordChange('y', e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Z Axis */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                    Z (Depth):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCoordChange('z', lightPos.z - 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={lightPos.z}
                      onChange={(e) => handleCoordChange('z', e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1 text-center font-bold text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleCoordChange('z', lightPos.z + 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-slate-500 text-[10px]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={modelBounds.zRange[0]}
                  max={modelBounds.zRange[1]}
                  step="0.5"
                  value={lightPos.z}
                  onChange={(e) => handleCoordChange('z', e.target.value)}
                  className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-800 rounded"
                />
              </div>
            </div>

            {/* Quick Position Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Quick Position Presets:
              </span>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('center')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-center cursor-pointer"
                >
                  ★ Centroid
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('top')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-center cursor-pointer"
                >
                  Upper Dome
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('base')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-center cursor-pointer"
                >
                  Base Mount
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('front')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-center cursor-pointer"
                >
                  Front (+Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('back')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-center cursor-pointer"
                >
                  Back (-Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('reset')}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DFM Status Badge Overlay */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border shadow-lg ${
            dfmStatus === 'PASS'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : dfmStatus === 'WARNING'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
          }`}
        >
          {dfmStatus === 'PASS' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>{dfmStatus === 'PASS' ? 'DFM Cleared' : dfmStatus === 'WARNING' ? 'DFM Warning' : 'DFM Error'}</span>
        </div>
      </div>

      {/* DFM Optical Physics Notice Banner: Displayed when Illumination is chosen with Opaque Material */}
      {(() => {
        const matSpec = MATERIAL_PREVIEWS[materialId] || MATERIAL_PREVIEWS.ti_6al_4v;
        const isTransparent = Boolean(matSpec.isTransparent || matSpec.transparent);
        const hasAddonIllumination = Boolean(illumination && illumination !== 'none');

        if (!hasAddonIllumination || isTransparent) return null;

        return (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[94%] bg-slate-950/95 border border-amber-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-fade-in text-left">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-300">
                    Physical Constraint: Opaque Material Blocks Internal Illumination
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    Watertight Wall • 0% Transmittance
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Physical Constraint: Selected material is opaque. Internal LED illumination will not shine through watertight opaque walls unless switched to a Transparent or Translucent material.
                </p>
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSwitchMaterial && onSwitchMaterial('sla_ultraclear')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 transition-colors cursor-pointer"
                  >
                    ★ Switch to UltraClear (92% Clear)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchMaterial && onSwitchMaterial('sla_frosted_diffuser')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors cursor-pointer"
                  >
                    ★ Switch to Frosted Opal Diffuser
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchMaterial && onSwitchMaterial('hybrid_metal_light')}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-[10px] font-mono text-amber-300 transition-colors cursor-pointer"
                  >
                    ★ Switch to Hybrid Metal + Luminaire
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Instructions footer bar */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Left-Click: Orbit
          </span>
          <span>Right-Click: Pan</span>
          <span>Scroll: Zoom</span>
          {isIlluminationActive && (
            <span className="text-amber-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-amber-400" /> Drag 3D Arrows to Move Light
            </span>
          )}
        </div>
        <div className="text-slate-400 flex items-center gap-1">
          <span>Active Material Preview:</span>
          <span className="font-semibold text-cyan-300 capitalize">{materialId.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
}
