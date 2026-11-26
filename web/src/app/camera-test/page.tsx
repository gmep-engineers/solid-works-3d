'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Video,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Grid,
  Maximize2,
  Download,
  Eye,
  Layers,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export default function CameraTestPage() {
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View modes: 'SINGLE' | 'SPLIT_STEREO' | 'DUAL_DEVICE' | 'ANAGLYPH_3D'
  const [viewMode, setViewMode] = useState<'SINGLE' | 'SPLIT_STEREO' | 'DUAL_DEVICE' | 'ANAGLYPH_3D'>('SPLIT_STEREO');

  // Video Settings
  const [reqResolution, setReqResolution] = useState<'AUTO' | '2560x960' | '1920x1080' | '1280x720' | '3840x1080'>('AUTO');
  const [reqFps, setReqFps] = useState<number>(30);

  // Live Telemetry
  const [actualResolution, setActualResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [currentFps, setCurrentFps] = useState<number>(0);
  const [aspectRatioStr, setAspectRatioStr] = useState<string>('Unknown');
  const [isWideDualFeed, setIsWideDualFeed] = useState<boolean>(false);

  // Image controls
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [mirror, setMirror] = useState<boolean>(false);

  // Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // DOM Refs
  const primaryVideoRef = useRef<HTMLVideoElement | null>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const anaglyphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const primaryStreamRef = useRef<MediaStream | null>(null);
  const secondaryStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(performance.now());

  // Enumerate video devices
  const loadDevices = async () => {
    setErrorMsg(null);
    try {
      // Trigger permission query if labels are empty
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tempStream.getTracks().forEach((t) => t.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1} (${d.deviceId.slice(0, 8)})`,
        }));

      setDevices(videoInputs);

      // Auto-select Camera201 if found, or first camera
      if (videoInputs.length > 0) {
        const dualCam = videoInputs.find(
          (d) => d.label.toLowerCase().includes('camera201') || d.label.toLowerCase().includes('dual'),
        );
        const defaultPrimary = dualCam ? dualCam.deviceId : videoInputs[0].deviceId;
        setSelectedDeviceId(defaultPrimary);

        if (videoInputs.length > 1) {
          const secondCam = videoInputs.find((d) => d.deviceId !== defaultPrimary);
          if (secondCam) setSelectedSecondaryId(secondCam.deviceId);
        }
      }
    } catch (err: any) {
      console.error('Error enumerating cameras:', err);
      setErrorMsg(`Camera access error: ${err.message || 'Permission denied or camera in use.'}`);
    }
  };

  useEffect(() => {
    loadDevices();
    return () => {
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (primaryStreamRef.current) {
      primaryStreamRef.current.getTracks().forEach((t) => t.stop());
      primaryStreamRef.current = null;
    }
    if (secondaryStreamRef.current) {
      secondaryStreamRef.current.getTracks().forEach((t) => t.stop());
      secondaryStreamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsStreaming(false);
    setActualResolution({ width: 0, height: 0 });
    setCurrentFps(0);
  };

  const startStream = async () => {
    stopStreams();
    setErrorMsg(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          frameRate: { ideal: reqFps },
        },
        audio: false,
      };

      if (reqResolution !== 'AUTO') {
        const [w, h] = reqResolution.split('x').map(Number);
        (constraints.video as MediaTrackConstraints).width = { ideal: w };
        (constraints.video as MediaTrackConstraints).height = { ideal: h };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      primaryStreamRef.current = stream;

      if (primaryVideoRef.current) {
        primaryVideoRef.current.srcObject = stream;
        await primaryVideoRef.current.play();
      }

      // If dual-device mode is active and secondary is selected
      if (viewMode === 'DUAL_DEVICE' && selectedSecondaryId && selectedSecondaryId !== selectedDeviceId) {
        try {
          const stream2 = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedSecondaryId } },
            audio: false,
          });
          secondaryStreamRef.current = stream2;
          if (secondaryVideoRef.current) {
            secondaryVideoRef.current.srcObject = stream2;
            await secondaryVideoRef.current.play();
          }
        } catch (e: any) {
          console.warn('Could not open secondary camera:', e);
        }
      }

      setIsStreaming(true);

      // Start FPS and canvas render loop
      fpsLastTimeRef.current = performance.now();
      fpsFrameCountRef.current = 0;
      requestAnimationFrame(renderLoop);
    } catch (err: any) {
      console.error('Failed to start camera stream:', err);
      setErrorMsg(`Failed to start video: ${err.message || 'Device in use or unsupported resolution'}`);
    }
  };

  // Canvas render loop for stereo split & 3D anaglyph
  const renderLoop = (time: number) => {
    const video = primaryVideoRef.current;
    if (video && video.readyState >= 2) {
      const w = video.videoWidth;
      const h = video.videoHeight;

      if (w > 0 && h > 0) {
        if (actualResolution.width !== w || actualResolution.height !== h) {
          setActualResolution({ width: w, height: h });
          const isWide = w >= h * 2.1;
          setIsWideDualFeed(isWide);
          const ratio = (w / h).toFixed(2);
          setAspectRatioStr(isWide ? `${ratio}:1 (UltraWide Stereo Dual)` : `${ratio}:1`);
        }

        // Split Stereo: render Left half to leftCanvas, Right half to rightCanvas
        const halfW = Math.floor(w / 2);

        if (leftCanvasRef.current) {
          const lCanvas = leftCanvasRef.current;
          if (lCanvas.width !== halfW || lCanvas.height !== h) {
            lCanvas.width = halfW;
            lCanvas.height = h;
          }
          const lCtx = lCanvas.getContext('2d');
          if (lCtx) {
            lCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
              grayscale ? ' grayscale(100%)' : ''
            }`;
            lCtx.drawImage(video, 0, 0, halfW, h, 0, 0, halfW, h);

            // Optional Grid
            if (showGrid) {
              drawCrosshairs(lCtx, halfW, h, 'Left Lens');
            }
          }
        }

        if (rightCanvasRef.current) {
          const rCanvas = rightCanvasRef.current;
          if (rCanvas.width !== halfW || rCanvas.height !== h) {
            rCanvas.width = halfW;
            rCanvas.height = h;
          }
          const rCtx = rCanvas.getContext('2d');
          if (rCtx) {
            rCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
              grayscale ? ' grayscale(100%)' : ''
            }`;
            rCtx.drawImage(video, halfW, 0, halfW, h, 0, 0, halfW, h);

            if (showGrid) {
              drawCrosshairs(rCtx, halfW, h, 'Right Lens');
            }
          }
        }

        // Anaglyph 3D Render
        if (anaglyphCanvasRef.current && (viewMode === 'ANAGLYPH_3D' || viewMode === 'SINGLE')) {
          const aCanvas = anaglyphCanvasRef.current;
          if (aCanvas.width !== halfW || aCanvas.height !== h) {
            aCanvas.width = halfW;
            aCanvas.height = h;
          }
          const aCtx = aCanvas.getContext('2d');
          if (aCtx) {
            // Draw left eye image
            aCtx.globalCompositeOperation = 'source-over';
            aCtx.drawImage(video, 0, 0, halfW, h, 0, 0, halfW, h);
            const leftImgData = aCtx.getImageData(0, 0, halfW, h);

            // Get right eye
            const tempC = document.createElement('canvas');
            tempC.width = halfW;
            tempC.height = h;
            const tempCtx = tempC.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(video, halfW, 0, halfW, h, 0, 0, halfW, h);
              const rightImgData = tempCtx.getImageData(0, 0, halfW, h);

              // Red-Cyan channel mix: Left = Red, Right = Green+Blue
              const outData = aCtx.createImageData(halfW, h);
              const totalPixels = halfW * h * 4;
              for (let i = 0; i < totalPixels; i += 4) {
                outData.data[i] = leftImgData.data[i]; // R from Left
                outData.data[i + 1] = rightImgData.data[i + 1]; // G from Right
                outData.data[i + 2] = rightImgData.data[i + 2]; // B from Right
                outData.data[i + 3] = 255;
              }
              aCtx.putImageData(outData, 0, 0);
            }
          }
        }
      }

      // FPS calculation
      fpsFrameCountRef.current++;
      const elapsed = time - fpsLastTimeRef.current;
      if (elapsed >= 1000) {
        const calculatedFps = Math.round((fpsFrameCountRef.current * 1000) / elapsed);
        setCurrentFps(calculatedFps);
        fpsFrameCountRef.current = 0;
        fpsLastTimeRef.current = time;
      }
    }

    if (primaryStreamRef.current) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }
  };

  const drawCrosshairs = (ctx: CanvasRenderingContext2D, w: number, h: number, label: string) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)'; // Cyan
    ctx.lineWidth = 1;

    // Center vertical & horizontal
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Center reticle circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 35, 0, 2 * Math.PI);
    ctx.stroke();

    // Parallax alignment horizontal guide marks
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'; // Amber
    for (let y = h / 4; y < h; y += h / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Label tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(10, 10, 110, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(label, 18, 26);

    ctx.restore();
  };

  const captureSnapshot = () => {
    const video = primaryVideoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `camera201-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    a.click();
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (!primaryStreamRef.current) return;
      recordedChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(primaryStreamRef.current, { mimeType: 'video/webm;codecs=vp8' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `camera201-recording-${Date.now()}.webm`;
          a.click();
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error('Recording error:', err);
        alert('Could not start video recording: ' + err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
              <span>HARDWARE DIAGNOSTICS</span>
              <span>/</span>
              <span>USB DUAL CAMERA MODULE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Camera className="w-6 h-6 text-cyan-400" />
              <span>Dual Camera Real-Time Video Testing Studio</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all"
            >
              Back to Operations
            </Link>
            <button
              type="button"
              onClick={loadDevices}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Ports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-5">
        {/* Hardware Status Alert Banner */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-cyan-800/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0 border border-cyan-500/30">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center space-x-2">
                <span>Active USB Device: VID_32E4 &amp; PID_A201 (Camera201)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  UVC VIDEO CLASS READY
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Hardware detected with 2 interfaces: <strong>UVC Video Stream (MI_00)</strong> + <strong>WinUSB Data Channel (MI_02)</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isStreaming ? (
              <button
                type="button"
                onClick={startStream}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START LIVE STREAM</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopStreams}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>STOP VIDEO FEED</span>
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-500 text-rose-200 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Control Toolbar */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left: Device Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Primary Camera Device:
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (isStreaming) setTimeout(startStream, 100);
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-bold min-w-[220px]"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Requested Resolution */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Requested Resolution:
              </label>
              <select
                value={reqResolution}
                onChange={(e) => setReqResolution(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
              >
                <option value="AUTO">Auto (Native Max)</option>
                <option value="2560x960">2560 × 960 (Dual-Lens UltraWide)</option>
                <option value="3840x1080">3840 × 1080 (Dual 1080p Stereo)</option>
                <option value="1920x1080">1920 × 1080 (Full HD)</option>
                <option value="1280x720">1280 × 720 (Standard HD)</option>
              </select>
            </div>
          </div>

          {/* Center: View Mode Pills */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Dual-Lens Display Mode:
            </label>
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('SPLIT_STEREO')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  viewMode === 'SPLIT_STEREO' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stereo Split (L / R)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('SINGLE')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  viewMode === 'SINGLE' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Raw Stream
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ANAGLYPH_3D')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  viewMode === 'ANAGLYPH_3D' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Anaglyph (Red/Cyan)
              </button>
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => setViewMode('DUAL_DEVICE')}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    viewMode === 'DUAL_DEVICE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dual Ports (2 Cams)
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 pt-2 sm:pt-0">
            <button
              type="button"
              disabled={!isStreaming}
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                showGrid ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Parallax Alignment Grid & Reticle"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={!isStreaming}
              onClick={captureSnapshot}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-40"
              title="Save Still PNG Frame"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>

            <button
              type="button"
              disabled={!isStreaming}
              onClick={toggleRecording}
              className={`px-3 py-2 rounded-xl font-bold text-xs border transition-all flex items-center space-x-1.5 ${
                isRecording
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              } disabled:opacity-40`}
            >
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-rose-500'}`} />
              <span>{isRecording ? 'Recording...' : 'Record'}</span>
            </button>
          </div>
        </div>

        {/* Live Video Canvas Area */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[480px] flex flex-col justify-center items-center">
          {/* Hidden Raw Video Elements for Canvas Blitting */}
          <video ref={primaryVideoRef} playsInline muted className="hidden" />
          <video ref={secondaryVideoRef} playsInline muted className="hidden" />

          {/* Off-air placeholder */}
          {!isStreaming && (
            <div className="text-center p-12 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto border border-slate-700">
                <Camera className="w-10 h-10 text-slate-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Camera Feed Inactive</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click <strong>&ldquo;Start Live Stream&rdquo;</strong> above to initialize the UVC stream from Camera201.
                </p>
              </div>
              <button
                type="button"
                onClick={startStream}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all inline-flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch Video Capture</span>
              </button>
            </div>
          )}

          {/* Active View: Stereo Split Mode (L / R) */}
          {isStreaming && viewMode === 'SPLIT_STEREO' && (
            <div className="w-full h-full p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Lens Viewport */}
              <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col justify-center items-center shadow-inner">
                <canvas ref={leftCanvasRef} className="max-w-full max-h-[580px] object-contain" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono font-bold text-cyan-300">
                  LENS 1 (LEFT EYE)
                </div>
              </div>

              {/* Right Lens Viewport */}
              <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col justify-center items-center shadow-inner">
                <canvas ref={rightCanvasRef} className="max-w-full max-h-[580px] object-contain" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono font-bold text-amber-300">
                  LENS 2 (RIGHT EYE)
                </div>
              </div>
            </div>
          )}

          {/* Active View: Full Raw Stream View */}
          {isStreaming && viewMode === 'SINGLE' && (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-black relative">
              <video
                ref={(el) => {
                  if (el && primaryStreamRef.current && el.srcObject !== primaryStreamRef.current) {
                    el.srcObject = primaryStreamRef.current;
                    el.play();
                  }
                }}
                playsInline
                autoPlay
                muted
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
                    grayscale ? ' grayscale(100%)' : ''
                  }`,
                }}
                className="max-w-full max-h-[640px] rounded-2xl border border-slate-800 shadow-xl object-contain"
              />
              <div className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono font-bold text-cyan-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>RAW COMPOSITE SENSOR FEED</span>
              </div>
            </div>
          )}

          {/* Active View: 3D Anaglyph Mode */}
          {isStreaming && viewMode === 'ANAGLYPH_3D' && (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-black relative">
              <canvas ref={anaglyphCanvasRef} className="max-w-full max-h-[640px] rounded-2xl border border-slate-800 shadow-xl" />
              <div className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono font-bold text-purple-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>3D STEREO ANAGLYPH (USE RED/CYAN GLASSES)</span>
              </div>
            </div>
          )}

          {/* Active View: Dual Device Mode */}
          {isStreaming && viewMode === 'DUAL_DEVICE' && (
            <div className="w-full h-full p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col justify-center items-center shadow-inner">
                <video
                  ref={(el) => {
                    if (el && primaryStreamRef.current && el.srcObject !== primaryStreamRef.current) {
                      el.srcObject = primaryStreamRef.current;
                      el.play();
                    }
                  }}
                  playsInline
                  autoPlay
                  muted
                  className="max-w-full max-h-[580px] object-contain"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono font-bold text-cyan-300">
                  PRIMARY PORT (CAM 1)
                </div>
              </div>

              <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col justify-center items-center shadow-inner">
                <video
                  ref={(el) => {
                    if (el && secondaryStreamRef.current && el.srcObject !== secondaryStreamRef.current) {
                      el.srcObject = secondaryStreamRef.current;
                      el.play();
                    }
                  }}
                  playsInline
                  autoPlay
                  muted
                  className="max-w-full max-h-[580px] object-contain"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono font-bold text-purple-300">
                  SECONDARY PORT (CAM 2)
                </div>
              </div>
            </div>
          )}

          {/* HUD Overlay Bottom Bar */}
          {isStreaming && (
            <div className="w-full bg-slate-900/90 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE UVC STREAM</span>
                </div>
                <div className="text-slate-400">
                  Resolution: <strong className="text-white">{actualResolution.width} × {actualResolution.height}</strong>
                </div>
                <div className="text-slate-400">
                  FPS: <strong className="text-cyan-400 font-black">{currentFps} FPS</strong>
                </div>
                <div className="text-slate-400 hidden sm:block">
                  Aspect: <strong className="text-slate-200">{aspectRatioStr}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span>Hardware: <strong>Camera201 (32E4:A201)</strong></span>
                <span>•</span>
                <span>Color: <strong>YUV/MJPEG</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Image Adjustment Sliders */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Sensor Post-Processing &amp; Calibration</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setBrightness(100);
                setContrast(100);
                setSaturation(100);
                setGrayscale(false);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Brightness</span>
                <span className="font-mono text-cyan-400">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono text-cyan-400">{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Saturation</span>
                <span className="font-mono text-cyan-400">{saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="rounded accent-cyan-500 w-4 h-4 bg-slate-800 border-slate-700"
                />
                <span className="text-[11px] font-semibold">Grayscale / IR Mode</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
