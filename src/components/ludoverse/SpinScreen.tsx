import React, { useState } from 'react';
import { COLORS, StateMode, ScreenStateMode } from '../../types/ludoverse';
import { EmptyState, Skeleton, toast } from './UIComponents';
import { AdManager } from './ads/AdManager';

const SEGMENTS = [
  { label: '+1', color: '#E63946', reward: 1 },
  { label: '+2', color: '#2A9D8F', reward: 2 },
  { label: 'Miss', color: '#457B9D', reward: 0 },
  { label: '+1', color: '#F4A261', reward: 1 },
  { label: '+3', color: '#8D99AE', reward: 3 },
  { label: 'Miss', color: '#457B9D', reward: 0 },
  { label: '+2', color: '#2A9D8F', reward: 2 },
  { label: '+1', color: '#E63946', reward: 1 },
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length;

export const SpinScreen: React.FC<{
  state?: StateMode | ScreenStateMode;
  stateMode?: StateMode | ScreenStateMode;
  coins?: number | null;
  onCoinsEarned?: (n: number) => void;
  onBack: () => void;
  onShowInterstitial?: () => void;
}> = ({
  state,
  stateMode,
  coins = 100,
  onCoinsEarned = () => {},
  onBack,
  onShowInterstitial = () => {},
}) => {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<{ id: string; label: string; time: number }[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  // Normalize state to lowercase ('loading' | 'empty' | 'data' | 'error')
  const currentState = String(state || stateMode || 'data').toLowerCase();

  const spin = () => {
    if (spinning || cooldown) return;

    const idx = Math.floor(Math.random() * SEGMENTS.length);
    const target = 360 * 5 + (360 - idx * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);

    setSpinning(true);
    setAngle(target);

    setTimeout(() => {
      const seg = SEGMENTS[idx];
      AdManager.log('rewarded', seg.reward);
      if (seg.reward > 0) onCoinsEarned(seg.reward);
      setHistory((h) => [{ id: Date.now().toString(), label: seg.label, time: Date.now() }, ...h]);
      setSpinning(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);

      // Ad frequency logic
      const newCount = spinCount + 1;
      setSpinCount(newCount);
      if (newCount === 2) {
        AdManager.log('banner');
        toast('Banner ad shown');
      }
      if (newCount % 6 === 0) {
        AdManager.log('interstitial');
        onShowInterstitial();
      }
    }, 3000);
  };

  if (currentState === 'loading') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6" style={{ background: COLORS.bgDark }}>
        <Skeleton w="280px" h="280px" radius={999} />
        <Skeleton w="120px" h="20px" />
      </div>
    );
  }

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const polar = (a: number, radius: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto" style={{ background: COLORS.bgDark }}>
      <div className="flex items-center px-4 h-14 gap-3">
        <button onClick={onBack} className="text-2xl">←</button>
        <span className="font-semibold">Lucky Spin</span>
        <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full" style={{ background: COLORS.yellow + '22', color: COLORS.yellow }}>
          🪙 {coins === null ? '–' : coins}
        </span>
      </div>

      <div className="flex flex-col items-center px-4 py-6">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20" style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: `20px solid ${COLORS.red}` }} />

          <svg
            width={size}
            height={size}
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
            }}
          >
            {SEGMENTS.map((s, i) => {
              const a1 = i * SEGMENT_ANGLE;
              const a2 = a1 + SEGMENT_ANGLE;
              const p1 = polar(a1, r);
              const p2 = polar(a2, r);
              const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
              const d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
              const mid = a1 + SEGMENT_ANGLE / 2;
              const lp = polar(mid, r * 0.7);
              return (
                <g key={i}>
                  <path d={d} fill={s.color} stroke="#fff" strokeWidth={2} />
                  <text x={lp.x} y={lp.y} fill="#fff" fontSize={16} fontWeight={700} textAnchor="middle" dominantBaseline="middle">
                    {s.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center button */}
          <button
            onClick={spin}
            disabled={spinning || cooldown}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full font-bold text-white text-sm"
            style={{
              background: spinning ? '#8D99AE' : COLORS.red,
              boxShadow: '0 4px 16px rgba(230,57,70,0.5)',
              opacity: cooldown ? 0.5 : 1,
            }}
          >
            {spinning ? '...' : cooldown ? '⏱' : 'SPIN'}
          </button>
        </div>

        <p className="mt-6 text-sm" style={{ color: COLORS.textSecondary }}>
          Spins this session: <span className="text-white font-semibold">{spinCount}</span>
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
          Banner every 2 spins · Interstitial every 6 spins
        </p>
      </div>

      <div className="px-4 pb-6">
        <h3 className="font-semibold text-sm mb-3">Spin History</h3>
        {currentState === 'loading' ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} h="52px" radius={12} />)}
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon="🎡" message="No spins yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-[12px] px-4 h-[52px]" style={{ background: COLORS.surfaceDark }}>
                <span className="text-sm">🎁 {h.label} coins</span>
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                  {new Date(h.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinScreen;
