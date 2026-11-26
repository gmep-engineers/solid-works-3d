'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModelViewer } from '@/components/3d/ModelViewer';
import { api } from '@/lib/api';
import {
  Share2,
  Camera,
  Video,
  Upload,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Heart,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ShowcasePage() {
  const params = useParams();
  const token = (params?.token as string) || 'share_alex_cyberpunk_samurai_2026';

  const [shareKit, setShareKit] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(42);
  const [hasLiked, setHasLiked] = useState(false);
  const [userDeskPhoto, setUserDeskPhoto] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState(
    'Completely blown away! The magnetic levitation is rock-solid and the internal wireless LEDs light up as soon as it floats above the pedestal.',
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const orderId = '44444444-4444-4444-4444-444444444444';
        const data = await api.getShareKit(orderId);
        setShareKit(data);
      } catch (err) {
        setShareKit({
          order_number: 'LEV-2026-891042',
          title: 'Cyberpunk Samurai Guardian — Custom Levitating Statue',
          description:
            'My custom AI-sculpted magnetic levitating statue just arrived! Floating on my desk with embedded wireless internal LED lighting. Created with Levitate3D.',
          share_token: token,
          showcase_url: typeof window !== 'undefined' ? window.location.href : '',
          model_glb_url: '/models/sample_levitating_statue.glb',
          platforms: [
            {
              platform: 'Twitter / X',
              direct_share_link:
                'https://twitter.com/intent/tweet?text=' +
                encodeURIComponent('Check out my custom floating statue made with Levitate3D! #LevitatingStatue'),
            },
            {
              platform: 'Facebook',
              direct_share_link: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window?.location?.href || ''),
            },
            {
              platform: 'Pinterest',
              direct_share_link: 'https://pinterest.com',
            },
          ],
        });
      }
    }
    loadData();
  }, [token]);

  const handleNativeShare = async () => {
    if (navigator.share && shareKit) {
      try {
        await navigator.share({
          title: shareKit.title,
          text: shareKit.description,
          url: window.location.href,
        });
        confetti();
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserDeskPhoto(event.target?.result as string);
        setIsSaved(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
      setHasLiked(false);
    } else {
      setLikes(likes + 1);
      setHasLiked(true);
      confetti({ particleCount: 40 });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Official Verified Showcase Landing Page</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Custom Levitating Statue <span className="gradient-text">Showcase</span>
        </h1>
        <p className="text-sm text-slate-600 font-normal">
          AI Sculpted via Levitate3D Engine • Calibrated for Active Magnetic Suspension • Illuminated with Wireless Induction
        </p>
      </div>

      {/* Main Grid: 3D Turntable on Left, Social Share Kit & Reviews on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive 3D Model Viewer with Turntable Recorder */}
        <div className="lg:col-span-7 space-y-4">
          <ModelViewer
            modelUrl={shareKit?.model_glb_url}
            internalLed={true}
            finish="TRANSLUCENT_GLOW"
            size="LARGE"
            autoRotate={true}
          />

          {/* Social Proof & Like Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLike}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  hasLiked
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likes} Likes</span>
              </button>

              <span className="text-xs text-slate-500 font-mono font-medium">Order #LEV-2026-891042</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleNativeShare}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>One-Tap Share</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors shadow-sm"
                title="Copy Public Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Social Share Kit Platforms & Real Desk Setup Upload */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Share Platforms Box */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-cyan-600" />
              <span>Share to Social Media</span>
            </h3>

            <div className="space-y-2">
              <a
                href={
                  shareKit?.platforms?.[0]?.direct_share_link ||
                  'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Check out my levitating statue!')
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-sm"
              >
                <span>Post to X (Twitter)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-sm"
              >
                <span>Share on Facebook</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="https://www.pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-sm"
              >
                <span>Pin to Pinterest</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            <div className="bg-cyan-50/70 p-3 rounded-xl border border-cyan-200 text-[11px] text-cyan-900 font-medium">
              <span className="font-bold">Pre-filled Tags:</span> #LevitatingStatue #Custom3D #DeskSetup #Levitate3D
            </div>
          </div>

          {/* Desk Setup Real Photo Upload */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cyan-600" />
              <span>Real Desk Photo & Video</span>
            </h3>

            {userDeskPhoto ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                <img src={userDeskPhoto} alt="Desk setup" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <label className="cursor-pointer text-xs font-bold text-white bg-slate-900 px-3.5 py-2 rounded-xl shadow-md">
                    Replace Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 flex flex-col items-center justify-center space-y-2 block">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <Upload className="w-6 h-6 text-cyan-600" />
                <div className="text-xs font-bold text-slate-800">Upload your glowing statue on your desk</div>
                <div className="text-[10px] text-slate-500">Unlocks community showcase spotlight</div>
              </label>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Verified Customer Review:</label>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-cyan-600 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
