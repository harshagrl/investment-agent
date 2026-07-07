import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

const steps = [
  { label: "Identifying entity", detail: "Checking market listing status" },
  { label: "Searching news", detail: "Pulling recent coverage & events" },
  { label: "Searching financials", detail: "Revenue, margins, growth signals" },
  { label: "Scanning red flags", detail: "Regulatory actions & controversies" },
  { label: "Synthesizing verdict", detail: "Generating structured analysis" },
];

export default function ThinkingSteps({ isColdStart }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-full max-w-md mx-auto p-5 rounded-lg mt-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-headline)' }}>
          Agent Running
        </span>
      </div>

      <div className="space-y-3.5">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isPast = index < currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div
              key={index}
              className="flex items-start gap-3 transition-opacity duration-300"
              style={{ opacity: isFuture ? 0.25 : 1 }}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isPast ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-strong-invest)' }} />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid var(--color-border)' }} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
                  {step.label}
                </p>
                {(isActive || isPast) && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isColdStart && (
        <div
          className="mt-5 px-3 py-2.5 rounded text-xs animate-pulse-subtle"
          style={{
            backgroundColor: 'rgba(91, 141, 239, 0.08)',
            border: '1px solid rgba(91, 141, 239, 0.2)',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Waking up backend server — first request may take up to 60s.
        </div>
      )}
    </div>
  );
}
