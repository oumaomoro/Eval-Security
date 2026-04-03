import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Lock, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
}

export function SignNowModal({ isOpen, onClose, url }: SignNowModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-3xl overflow-hidden flex flex-col h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tighter italic">Secure E-Signature Session</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> RSA-4096 Encrypted
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">•</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">SignNow Enterprise Gateway</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content / Iframe */}
            <div className="flex-1 bg-slate-950 relative">
              {!url ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Initializing Secure Stream...</p>
                </div>
              ) : (
                <iframe
                  src={url}
                  className="w-full h-full border-none"
                  title="SignNow Embedded Signature"
                  allow="geolocation"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Live Session Telemetry Active</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 font-medium italic">
                Session ends automatically. Closing this window will terminate the signing request.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
