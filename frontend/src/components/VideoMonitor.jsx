import React, { useState, useRef } from 'react';
import { Camera, Upload, Square, Video, Radio, AlertTriangle } from 'lucide-react';

export function VideoMonitor({ source, onStartWebcam, onUploadVideo, onStopVideo, peopleCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleWebcam = async () => {
    setErrorMsg(null);
    const success = await onStartWebcam();
    if (!success) {
      setErrorMsg("Unable to access webcam. Please check camera permissions.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);
    const success = await onUploadVideo(file);
    setIsUploading(false);
    if (!success) {
      setErrorMsg("Failed to upload or process video file.");
    }
  };

  const isLive = source === 'webcam' || source === 'file';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Top Monitor Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-wide">LIVE CAMERA MONITOR</h2>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE</span>
            </div>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Video Stream Container */}
      <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden min-h-[340px] flex items-center justify-center">
        {isLive ? (
          <img
            src="/api/video_feed"
            alt="Live YOLO Camera Feed"
            className="w-full h-full object-contain"
            onError={() => setErrorMsg("Stream disconnected or stopped.")}
          />
        ) : (
          <div className="text-center p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-300 mb-1">No Camera Feed Active</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
              Start your laptop webcam or upload a sample video file to begin YOLO real-time crowd detection.
            </p>
          </div>
        )}

        {/* Live People Count Overlay Badge */}
        {isLive && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="text-xs font-bold text-slate-200">
              Detected: <strong className="text-white text-sm">{peopleCount}</strong> people
            </span>
          </div>
        )}
      </div>

      {/* Error Message banner */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleWebcam}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              source === 'webcam'
                ? 'bg-blue-600 text-white shadow-blue-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-400" />
            <span>Start Webcam</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/mp4,video/avi,video/mov,video/mkv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              source === 'file'
                ? 'bg-blue-600 text-white shadow-blue-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>{isUploading ? 'Uploading...' : 'Upload Video'}</span>
          </button>
        </div>

        {isLive && (
          <button
            onClick={onStopVideo}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop Processing</span>
          </button>
        )}
      </div>
    </div>
  );
}
