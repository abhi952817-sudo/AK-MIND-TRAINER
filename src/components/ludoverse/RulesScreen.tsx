// src/components/ludoverse/RulesScreen.tsx
// Comprehensive Rulebook & Guide for all Ludo variations:
// Classic (4P), Octagon (8P), Quick/Rush, Team (2v2), and Tournament Master Rules.

import React, { useState } from 'react';
import { X, Dices, ArrowRightCircle, Shield, Trophy, FileText, Zap, Users, Sparkles } from 'lucide-react';
import { Button } from './UIComponents';

interface RulesScreenProps {
  onClose: () => void;
  initialSection?: 'rules' | 'terms';
}

type TabType = 'all' | 'classic' | 'octagon' | 'quick' | 'team';

export const RulesScreen: React.FC<RulesScreenProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  return (
    <div className="w-full h-full flex flex-col justify-between p-5 select-none overflow-y-auto no-scrollbar bg-[#161824] text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 mb-3 border-b border-white/10 pb-3 shrink-0">
        <div>
          <h1 className="font-heading text-lg font-bold">Complete Ludo Rulebook</h1>
          <p className="text-[11px] text-[#8D99AE]">Official rules for all game variations</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Variation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 shrink-0">
        {[
          { id: 'all', label: 'All Rules' },
          { id: 'classic', label: '🪵 Classic (4P)' },
          { id: 'octagon', label: '🔷 Octagon (8P)' },
          { id: 'quick', label: '⚡ Quick / Rush' },
          { id: 'team', label: '👥 Team (2v2)' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as TabType)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rule Cards */}
      <div className="flex-1 space-y-3.5 my-2 overflow-y-auto pr-0.5">
        {/* Section 1 — Classic 4-Player Rules */}
        {(activeTab === 'all' || activeTab === 'classic') && (
          <div className="p-4 rounded-2xl bg-[#1E2235] border border-white/10 shadow-sm flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E63946]/15 text-[#E63946] flex items-center justify-center shrink-0">
              <Dices className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span>1. Classic 4-Player Ludo Rules</span>
              </h2>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
                <li><strong className="text-white">Unlocking Token:</strong> Roll a <strong className="text-yellow-400">6</strong> to move a token from base to the starting cell.</li>
                <li><strong className="text-white">Movement:</strong> Move clockwise along the 52-cell track matching the dice value.</li>
                <li><strong className="text-white">Extra Turns:</strong> Rolling a 6, capturing an opponent, or entering home grants an immediate extra roll.</li>
                <li><strong className="text-white">Three 6s Rule:</strong> Rolling three consecutive sixes forfeits the turn immediately.</li>
                <li><strong className="text-white">Capturing:</strong> Landing on an opponent sends their token back to base. Safe cells (marked with ★) are safe from capture.</li>
                <li><strong className="text-white">Winning:</strong> First player to guide all 4 tokens into the central home triangle wins!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Section 2 — 8-Player Octagonal Rules */}
        {(activeTab === 'all' || activeTab === 'octagon') && (
          <div className="p-4 rounded-2xl bg-[#1E2235] border border-white/10 shadow-sm flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-sm font-bold text-white mb-1.5">
                2. 8-Player Octagonal Ludo Rules
              </h2>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
                <li><strong className="text-white">8 Sectors:</strong> Blue (01), Cyan (02), Magenta (03), Purple (04), Yellow (05), Orange (06), Red (07), Green (08).</li>
                <li><strong className="text-white">64-Step Perimeter:</strong> Tokens navigate across all 8 sectors clockwise.</li>
                <li><strong className="text-white">Start & Stop Cells:</strong> Every sector features a designated &quot;Start&quot; entrance and a safe &quot;Stop&quot; (★) cell.</li>
                <li><strong className="text-white">Live Path Preview:</strong> Tapping or hovering on a movable token highlights its step-by-step route (① ➜ ② ➜ ③...) and landing beacon!</li>
                <li><strong className="text-white">Home Runway:</strong> After a full circuit, enter your 5-cell colored runway leading to the central victory star.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Section 3 — Quick & Rush Ludo */}
        {(activeTab === 'all' || activeTab === 'quick') && (
          <div className="p-4 rounded-2xl bg-[#1E2235] border border-white/10 shadow-sm flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-sm font-bold text-white mb-1.5">
                3. Quick / Rush Ludo (Fast-Paced)
              </h2>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
                <li><strong className="text-white">Fast Unlock:</strong> Tokens start already on the track or unlock on rolling 1 or 6.</li>
                <li><strong className="text-white">Quick Win Condition:</strong> Capture at least 1 opponent token and bring 1 token home to win (match ends in ~5 mins).</li>
                <li><strong className="text-white">Timer Constraint:</strong> Rapid 15s turn limit keeps games blazing fast.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Section 4 — Team & Doubles (2v2) */}
        {(activeTab === 'all' || activeTab === 'team') && (
          <div className="p-4 rounded-2xl bg-[#1E2235] border border-white/10 shadow-sm flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-sm font-bold text-white mb-1.5">
                4. Team Ludo (2v2 Partner Play)
              </h2>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
                <li><strong className="text-white">Partner Setup:</strong> Opposing players sit across each other as teammates (e.g. Blue + Yellow vs Red + Green).</li>
                <li><strong className="text-white">No Friendly Fire:</strong> You cannot capture your partner&apos;s tokens.</li>
                <li><strong className="text-white">Partner Support:</strong> Once all 4 of your tokens reach home, your turns help move your partner&apos;s tokens!</li>
                <li><strong className="text-white">Team Victory:</strong> First team to bring all 8 combined tokens home wins.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Section 5 — Safe Cells & Blockades */}
        <div className="p-4 rounded-2xl bg-[#1E2235] border border-white/10 shadow-sm flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-sm font-bold text-white mb-1.5">
              5. Safe Zones & Blockades
            </h2>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
              <li><strong className="text-white">Star Cells (★):</strong> Completely immune to captures.</li>
              <li><strong className="text-white">Home Runways:</strong> Colored corridors are exclusive to each player and 100% safe.</li>
              <li><strong className="text-white">Blockades:</strong> Two tokens of the same color on a cell form a blockade that opponents cannot capture.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Close Button */}
      <Button
        variant="primary"
        onClick={onClose}
        className="w-full h-11 rounded-xl text-xs font-bold mt-2 shrink-0"
      >
        Close & Play
      </Button>
    </div>
  );
};
