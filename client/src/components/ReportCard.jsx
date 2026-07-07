import React from 'react';
import { ExternalLink, AlertCircle, Briefcase, TrendingUp, ShieldAlert } from 'lucide-react';

// --- Verdict Spectrum Config ---
const verdictConfig = {
  "Strong Invest": { color: '#2EE895', position: 5 },
  "Lean Invest":   { color: '#5AD9A4', position: 25 },
  "Neutral":       { color: '#E0B640', position: 50 },
  "Lean Pass":     { color: '#F08C42', position: 75 },
  "Strong Pass":   { color: '#FF4A53', position: 95 },
  "Insufficient Data": { color: '#8B92A5', position: 50 },
};

// --- Sub-Components ---

function VerdictGauge({ verdict, confidence }) {
  const config = verdictConfig[verdict] || verdictConfig["Neutral"];
  const markerPosition = config.position;

  return (
    <div className="w-full">
      {/* Gauge Bar — luminous gradient track */}
      <div
        className="relative w-full h-2.5 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #2EE895, #5AD9A4, #E0B640, #F08C42, #FF4A53)',
          boxShadow: '0 0 12px rgba(46, 232, 149, 0.15), 0 0 12px rgba(255, 74, 83, 0.15), inset 0 1px 2px rgba(255,255,255,0.08)',
        }}
      >
        {/* Marker with radial glow */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-700 ease-out"
          style={{
            left: `${markerPosition}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: config.color,
            boxShadow: `0 0 10px ${config.color}, 0 0 24px ${config.color}80, 0 0 40px ${config.color}40`,
            border: '2px solid var(--color-bg)',
          }}
        />
      </div>

      {/* Labels below gauge */}
      <div className="flex justify-between mt-2.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#2EE895', fontFamily: 'var(--font-mono)' }}>Invest</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#FF4A53', fontFamily: 'var(--font-mono)' }}>Pass</span>
      </div>

      {/* Verdict + Confidence readout */}
      <div className="mt-5 flex items-baseline justify-between">
        <span
          className="text-xl font-bold"
          style={{
            color: config.color,
            fontFamily: 'var(--font-headline)',
            textShadow: `0 0 20px ${config.color}30`,
          }}
        >
          {verdict}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Confidence: <span className="font-mono-num font-bold" style={{ color: config.color }}>{confidence}%</span>
        </span>
      </div>

      {/* Verdict badge with glow */}
      <div
        className="mt-3 inline-flex items-center px-3 py-1.5"
        style={{
          backgroundColor: `${config.color}12`,
          borderRadius: '8px',
          boxShadow: `0 0 16px ${config.color}20`,
        }}
      >
        <span className="text-xs font-semibold" style={{ color: config.color, fontFamily: 'var(--font-mono)' }}>
          {verdict === "Insufficient Data" ? "—" : confidence >= 70 ? "HIGH CONVICTION" : confidence >= 40 ? "MODERATE" : "LOW CONVICTION"}
        </span>
      </div>
    </div>
  );
}

function ReasoningSection({ icon: Icon, title, items, accentColor }) {
  return (
    <div className="py-5" style={{ borderBottom: 'none' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-headline)' }}>
          {title}
        </h3>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-2.5 pl-6">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic pl-6" style={{ color: 'var(--color-text-muted)' }}>No data available.</p>
      )}
      {/* Subtle separator — background-based, not border */}
      <div className="mt-5" style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--color-elevated), transparent)' }} />
    </div>
  );
}

function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="pt-5">
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all"
            style={{
              backgroundColor: 'var(--color-elevated)',
              borderRadius: '8px',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#242938';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-elevated)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[180px]">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// --- Main ReportCard ---

export default function ReportCard({ data, originalQuery }) {
  // --- Insufficient Data / Invalid Entity ---
  if (data.verdict === "Insufficient Data" || data.insufficient_data_reason) {
    return (
      <div
        className="w-full max-w-2xl mx-auto mt-10 p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)',
          border: 'none',
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
          <div>
            <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-text-primary)' }}>
              Insufficient Data
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {data.insufficient_data_reason || "Not enough information to form a verdict."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Full Report ---
  return (
    <div
      className="w-full max-w-5xl mx-auto mt-10 overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-card)',
        border: 'none',
      }}
    >
      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT COLUMN: Gauge + Key Stats (sticky on desktop) */}
        <div
          className="w-full lg:w-[360px] flex-shrink-0 p-6 lg:p-8 lg:sticky lg:top-0 lg:self-start"
          style={{
            /* No border — use background step for separation */
            backgroundColor: 'rgba(13, 15, 19, 0.3)',
          }}
        >
          <p className="text-[10px] uppercase tracking-widest mb-5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Verdict
          </p>
          <VerdictGauge verdict={data.verdict} confidence={data.confidence} />

          {!data.is_listed && (
            <div
              className="text-xs mt-4 px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#E0B640',
                backgroundColor: 'rgba(224, 182, 64, 0.06)',
                borderRadius: '8px',
                boxShadow: '0 0 12px rgba(224, 182, 64, 0.08)',
              }}
            >
              Unlisted company — analysis based on qualitative signals only, financial ratios unavailable
            </div>
          )}

          {data.resolved_name && originalQuery && data.resolved_name.toLowerCase() !== originalQuery.toLowerCase().trim() && (
            <div
              className="text-xs mt-2 px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-elevated)',
                borderRadius: '8px',
              }}
            >
              Interpreting "{originalQuery}" as {data.resolved_name}
            </div>
          )}

          {/* Key Stats — numbers as visual anchors */}
          <div className="mt-8 pt-6" style={{ borderTop: 'none' }}>
            {/* Subtle separator */}
            <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--color-elevated), transparent)' }} />
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Analysis Summary
            </p>
            <div className="grid grid-cols-2 gap-5 mt-3">
              <div>
                <p className="font-mono-num text-2xl font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {data.business_quality?.length || 0}
                </p>
                <p className="text-[10px] uppercase mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Quality signals</p>
              </div>
              <div>
                <p className="font-mono-num text-2xl font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {data.momentum?.length || 0}
                </p>
                <p className="text-[10px] uppercase mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Momentum signals</p>
              </div>
              <div>
                <p className="font-mono-num text-2xl font-bold leading-none" style={{ color: data.red_flags?.length > 0 ? 'var(--color-strong-pass)' : 'var(--color-strong-invest)' }}>
                  {data.red_flags?.length || 0}
                </p>
                <p className="text-[10px] uppercase mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Flagged</p>
              </div>
              <div>
                <p className="font-mono-num text-2xl font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {data.sources?.length || 0}
                </p>
                <p className="text-[10px] uppercase mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Cited</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Reasoning buckets + Sources */}
        <div className="flex-1 p-6 lg:p-8">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Detailed Analysis
          </p>

          <ReasoningSection
            icon={Briefcase}
            title="Business Quality"
            items={data.business_quality}
            accentColor="var(--color-accent)"
          />
          <ReasoningSection
            icon={TrendingUp}
            title="Momentum & Trajectory"
            items={data.momentum}
            accentColor="var(--color-lean-invest)"
          />
          <ReasoningSection
            icon={ShieldAlert}
            title="Red Flags"
            items={data.red_flags}
            accentColor="var(--color-strong-pass)"
          />

          <SourceChips sources={data.sources} />
        </div>
      </div>
    </div>
  );
}
