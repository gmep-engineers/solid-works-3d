'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Camera, Download, Play, RotateCw, Sparkles, Video, Loader2, Check } from 'lucide-react';

interface ModelViewerProps {
  modelUrl?: string;
  internalLed?: boolean;
  finish?: 'MATTE_WHITE' | 'TRANSLUCENT_GLOW' | 'FULL_COLOR';
  size?: 'STANDARD' | 'LARGE';
  autoRotate?: boolean;
  className?: string;
  onSnapshotTaken?: (dataUrl: string) => void;
  onVideoRecorded?: (videoBlobUrl: string) => void;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  internalLed = false,
  finish = 'FULL_COLOR',
  size = 'STANDARD',
  autoRotate = true,
  className = '',
  onSnapshotTaken,
  onVideoRecorded,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const statueGroupRef = useRef<THREE.Group | null>(null);
  const placeholderGroupRef = useRef<THREE.Group | null>(null);
  const customModelRef = useRef<THREE.Object3D | null>(null);
  const internalLedLightRef = useRef<THREE.PointLight | null>(null);
  const baseRingLightRef = useRef<THREE.Mesh | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isFloating, setIsFloating] = useState(true);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadedModelName, setLoadedModelName] = useState<string | null>(null);

  // Initialize Three.js Scene and Base
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 460;

    // 1. Scene with Clean White Studio Background
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc);

    // Subtle soft grid floor
    const grid = new THREE.GridHelper(10, 20, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -1.2;
    scene.add(grid);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.8);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and preserveDrawingBuffer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.replaceChildren(renderer.domElement);

    // 4. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const cyanFillLight = new THREE.DirectionalLight(0x06b6d4, 0.9);
    cyanFillLight.position.set(-3, 3, 2);
    scene.add(cyanFillLight);

    const backLight = new THREE.DirectionalLight(0x818cf8, 0.7);
    backLight.position.set(0, 4, -4);
    scene.add(backLight);

    // 5. MAGNETIC LEVITATION PEDESTAL (BASE)
    const baseGroup = new THREE.Group();
    baseGroup.position.y = -1.0;

    // Outer pedestal chassis
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.35, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.receiveShadow = true;
    baseGroup.add(baseMesh);

    // Center Electromagnet Core Recess
    const coreGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.18;
    baseGroup.add(coreMesh);

    // Radiant Neon Illumination Ring on Pedestal
    const ringGeo = new THREE.TorusGeometry(1.1, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.19;
    baseRingLightRef.current = ringMesh;
    baseGroup.add(ringMesh);

    // Soft realistic shadow under pedestal
    const shadowGeo = new THREE.CircleGeometry(1.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.19;
    baseGroup.add(shadowPlane);

    scene.add(baseGroup);

    // 6. FLOATING CUSTOM 3D STATUE GROUP
    const statueGroup = new THREE.Group();
    statueGroupRef.current = statueGroup;
    statueGroup.position.set(0, 0.2, 0);

    // Embedded Levitation Magnet Disk
    const magnetDiskGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32);
    const magnetMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.15 });
    const magnetDisk = new THREE.Mesh(magnetDiskGeo, magnetMat);
    magnetDisk.position.y = -0.45;
    statueGroup.add(magnetDisk);

    // Placeholder Geometric Mesh Group (displayed when no custom GLB is loaded)
    const placeholderGroup = new THREE.Group();
    placeholderGroupRef.current = placeholderGroup;

    const statueGeo = new THREE.IcosahedronGeometry(0.75, 1);
    const statueMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.1,
    });
    const statueMesh = new THREE.Mesh(statueGeo, statueMat);
    statueMesh.castShadow = true;
    statueMesh.position.y = 0.25;
    placeholderGroup.add(statueMesh);

    const ringOrnamentGeo = new THREE.TorusGeometry(0.9, 0.025, 16, 48);
    const ringOrnamentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const ringOrnament = new THREE.Mesh(ringOrnamentGeo, ringOrnamentMat);
    ringOrnament.rotation.x = Math.PI / 3;
    ringOrnament.position.y = 0.25;
    placeholderGroup.add(ringOrnament);

    const coreCrystalGeo = new THREE.OctahedronGeometry(0.18, 0);
    const coreCrystalMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true });
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, coreCrystalMat);
    coreCrystal.position.set(0, 0.25, 0);
    placeholderGroup.add(coreCrystal);

    statueGroup.add(placeholderGroup);

    // Internal Wireless Inductive LED Point Light (Warm neutral glow so true model colors shine through)
    const internalLight = new THREE.PointLight(0xfff7ed, internalLed ? 2.2 : 0.0, 3.5);
    internalLight.position.set(0, 0.25, 0);
    internalLedLightRef.current = internalLight;
    statueGroup.add(internalLight);

    scene.add(statueGroup);

    // Mouse interactive drag orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const domElement = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !statueGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      statueGroupRef.current.rotation.y += deltaX * 0.01;
      camera.position.y = Math.max(0.4, Math.min(2.5, camera.position.y + deltaY * 0.005));
      camera.lookAt(0, 0.2, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = e.deltaY * 0.003;
      camera.position.z = Math.max(1.8, Math.min(6.0, camera.position.z + zoom));
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (statueGroupRef.current) {
        // Sinusoidal magnetic levitation floating wave
        if (isFloating) {
          const hoverOffset = Math.sin(elapsed * 2.2) * 0.08;
          const tiltOffset = Math.cos(elapsed * 1.5) * 0.02;
          statueGroupRef.current.position.y = 0.2 + hoverOffset;
          statueGroupRef.current.rotation.z = tiltOffset;
        }

        // Automatic gentle continuous turntable rotation
        if (autoRotate && !isDragging) {
          statueGroupRef.current.rotation.y += 0.008;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 460;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Effect to load custom .GLB model whenever modelUrl changes
  useEffect(() => {
    if (!statueGroupRef.current) return;

    if (!modelUrl) {
      // Revert to placeholder if no custom model URL
      if (customModelRef.current) {
        statueGroupRef.current.remove(customModelRef.current);
        customModelRef.current = null;
      }
      if (placeholderGroupRef.current) {
        placeholderGroupRef.current.visible = true;
      }
      setLoadedModelName(null);
      return;
    }

    setIsLoadingModel(true);
    const loader = new GLTFLoader();
    const resolvedModelUrl =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
        ? modelUrl.replace(/^https?:\/\/localhost:\d+/, '')
        : modelUrl;

    loader.load(
      resolvedModelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Calculate bounding box and center geometry
        const box = new THREE.Box3().setFromObject(model);
        const sizeVec = new THREE.Vector3();
        box.getSize(sizeVec);
        const centerVec = new THREE.Vector3();
        box.getCenter(centerVec);

        // Center model right above magnet
        model.position.x = -centerVec.x;
        model.position.y = -centerVec.y + 0.35;
        model.position.z = -centerVec.z;

        // Auto-scale to fit perfectly in levitation zone (~1.4 units height)
        const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        if (maxDim > 0) {
          const targetScale = (size === 'LARGE' ? 1.6 : 1.35) / maxDim;
          model.scale.set(targetScale, targetScale, targetScale);
        }

        // Apply finish styling & enable shadows
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (finish === 'TRANSLUCENT_GLOW') {
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0x38bdf8,
                roughness: 0.15,
                transmission: 0.85,
                thickness: 1.0,
                transparent: true,
                opacity: 0.85,
              });
            } else if (finish === 'MATTE_WHITE') {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                roughness: 0.35,
                metalness: 0.1,
              });
            }
            // If FULL_COLOR, retain original PBR textures from AI generator!
          }
        });

        // Remove previous custom model
        if (customModelRef.current) {
          statueGroupRef.current?.remove(customModelRef.current);
        }

        // Hide placeholder
        if (placeholderGroupRef.current) {
          placeholderGroupRef.current.visible = false;
        }

        customModelRef.current = model;
        statueGroupRef.current?.add(model);
        setIsLoadingModel(false);
        setLoadedModelName('Custom Synthesized 3D Sculpture');
      },
      (xhr) => {
        // progress
      },
      (err) => {
        console.warn('Failed to load custom GLB model:', err);
        setIsLoadingModel(false);
      }
    );
  }, [modelUrl, finish, size]);

  // Update internal LED dynamic lighting
  useEffect(() => {
    if (internalLedLightRef.current) {
      internalLedLightRef.current.intensity = internalLed ? 4.5 : 0.0;
    }
  }, [internalLed]);

  // Snapshot Capture Feature
  const handleSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (onSnapshotTaken) {
      onSnapshotTaken(dataUrl);
    } else {
      const link = document.createElement('a');
      link.download = `levitate3d-statue-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // 360 Turntable Video Recorder
  const handleRecord360 = async () => {
    if (!rendererRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingProgress(0);

      const canvas = rendererRef.current.domElement;
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        if (onVideoRecorded) {
          onVideoRecorded(videoUrl);
        } else {
          const a = document.createElement('a');
          a.download = `levitate3d-turntable-${Date.now()}.webm`;
          a.href = videoUrl;
          a.click();
        }
        setIsRecording(false);
      };

      mediaRecorder.start();

      const duration = 5000;
      const interval = 100;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        setRecordingProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
        if (elapsed >= duration) {
          clearInterval(timer);
          mediaRecorder.stop();
        }
      }, interval);
    } catch (err) {
      console.error('Failed to record turntable video:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl ${className}`}>
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-[460px] cursor-grab active:cursor-grabbing bg-slate-50" />

      {/* Model Loading Spinner Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 z-20">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          <span className="text-xs font-bold text-slate-800">Loading Synthesized 3D Model...</span>
          <span className="text-[11px] text-slate-500 font-mono">Streaming geometry from cloud vault</span>
        </div>
      )}

      {/* Floating Status Pill */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 text-xs shadow-sm z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-slate-800 font-semibold">
          {loadedModelName ? loadedModelName : 'Levitating (Magnetic Equilibrium)'}
        </span>
      </div>

      {/* Embedded LED Indicator */}
      {internalLed && (
        <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-cyan-50/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-300 text-xs text-cyan-800 font-semibold shadow-sm z-10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Wireless LED Active</span>
        </div>
      )}

      {/* Interactive Controls Overlay Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setIsFloating(!isFloating)}
            className={`px-3 py-2 rounded-xl backdrop-blur-md text-xs font-semibold border transition-all shadow-sm ${
              isFloating
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Levitation Bobbing"
          >
            <RotateCw className="w-3.5 h-3.5 inline mr-1" />
            {isFloating ? 'Levitating' : 'Static'}
          </button>
        </div>

        {/* Export & Capture Actions */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={handleSnapshot}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-sm"
            title="Capture High-Res Photo"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-600" />
            <span>Snapshot</span>
          </button>

          <button
            onClick={handleRecord360}
            disabled={isRecording}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            title="Generate 360 Turntable Video"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isRecording ? `Recording ${recordingProgress}%` : '360° Turntable'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
