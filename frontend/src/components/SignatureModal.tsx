import React, { useRef, useState, useEffect } from 'react';
import { SignatureData } from '../types';
import confetti from 'canvas-confetti';
import { PenLine, Type, RotateCcw, Check, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  onSaveSignature: (sig: SignatureData) => void;
  currentSignature: SignatureData;
}

export const SignatureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  candidateName,
  onSaveSignature,
  currentSignature,
}) => {
  const [tab, setTab] = useState<'draw' | 'type'>('type');
  const [typedName, setTypedName] = useState(candidateName);
  const [agreed, setAgreed] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTypedName(candidateName);
      if (tab === 'draw') {
        initCanvas();
      }
    }
  }, [isOpen, candidateName, tab]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#111c2c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    if (!agreed) return;

    let content = typedName;
    if (tab === 'draw' && canvasRef.current) {
      content = canvasRef.current.toDataURL('image/png');
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    onSaveSignature({
      isSigned: true,
      signatureType: tab,
      signatureContent: content,
      signedAt: todayStr,
      accepted: true,
    });

    // Confetti animation celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff7f11', '#EA580C', '#16a34a', '#111c2c'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Digital Signature &amp; Offer Acceptance
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTab('type')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'type'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type Name
            </button>
            <button
              onClick={() => setTab('draw')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'draw'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Draw Signature
            </button>
          </div>

          {/* Type Input Mode */}
          {tab === 'type' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name as Signer
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Narendhar Dhandapani"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                  Signature Preview
                </span>
                <div className="font-signature text-3xl text-[#111c2c] py-2 min-h-[44px]">
                  {typedName || candidateName}
                </div>
              </div>
            </div>
          )}

          {/* Draw Mode */}
          {tab === 'draw' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Draw your signature inside the box:</span>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-[11px] text-[#EA580C] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={140}
                  className="cursor-crosshair w-full h-[140px] touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <span className="absolute pointer-events-none text-slate-400 text-xs italic">
                    Sign with finger or mouse here
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Acknowledgment checkbox */}
          <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-[#EA580C] focus:ring-[#EA580C]"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I acknowledge that I have read and agree to all terms, compensation schedules, and policies set forth in this document.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!agreed || (tab === 'type' && !typedName.trim()) || (tab === 'draw' && !hasDrawn)}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-md bg-[#EA580C] hover:bg-[#743500] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            Accept &amp; Sign Document
          </button>
        </div>
      </div>
    </div>
  );
};
