import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('costloci_onboarded');
    if (!hasSeenTour) {
      // Small delay for smooth entrance after login
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('costloci_onboarded', 'true');
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  const steps = [
    {
      title: "Welcome to Costloci Enterprise",
      desc: "Your AI-powered Contract Risk and Compliance engine. Let's get you oriented in 30 seconds.",
      actionText: "Start Tour",
      icon: "👋"
    },
    {
      title: "Upload & Analyze",
      desc: "Drag and drop any vendor contract (PDF/DOCX) in the Upload section. Our RAG engine automatically normalizes it against global standards like GDPR and KDPA.",
      actionText: "Next: Portfolio Analytics",
      icon: "📄",
      onAction: () => navigate('/dashboard') // keeping it simple, assume they navigate naturally
    },
    {
      title: "Global Readiness Matrix",
      desc: "Your dashboard dynamically assesses your entire vendor portfolio's compliance posture across required jurisdictions.",
      actionText: "Finish Onboarding",
      icon: "🌍",
      onAction: () => navigate('/dashboard')
    }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-300">
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={20} />
        </button>
        
        <div className="h-1.5 flex w-full">
           <div className="bg-blue-600 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
           <div className="bg-slate-100 dark:bg-slate-800 flex-1"></div>
        </div>
        
        <div className="p-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-blue-100 dark:border-blue-800/50 shadow-inner">
            {current.icon}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{current.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-8">{current.desc}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}></div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                 if (current.onAction && step < steps.length - 1) current.onAction();
                 nextStep();
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {current.actionText} {step === steps.length - 1 ? <Check size={16} strokeWidth={3}/> : <ChevronRight size={16} strokeWidth={3}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
