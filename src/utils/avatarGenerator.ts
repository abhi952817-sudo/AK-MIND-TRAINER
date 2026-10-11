export interface AvatarConfig {
  characterId: string;
  accessoryId: string;
  auraId: string;
  expressionId: string;
}

export interface CharacterAsset {
  id: string;
  name: string;
  emoji: string;
  accentColor: string;
  skinTone: string;
  hairColor: string;
  bodyColor: string;
}

export interface AccessoryAsset {
  id: string;
  name: string;
  emoji: string;
  offsetY: number;
}

export interface AuraAsset {
  id: string;
  name: string;
  from: string;
  to: string;
  border: string;
  glow: string;
}

export interface ExpressionAsset {
  id: string;
  name: string;
  emoji: string;
}

export const CHARACTERS: CharacterAsset[] = [
  { id: 'king', name: 'Ludo King', emoji: '🤴', accentColor: '#fbbf24', skinTone: '#fed7aa', hairColor: '#b45309', bodyColor: '#dc2626' },
  { id: 'queen', name: 'Empress', emoji: '👸', accentColor: '#ec4899', skinTone: '#fde047', hairColor: '#9333ea', bodyColor: '#7c3aed' },
  { id: 'ninja', name: 'Cyber Ninja', emoji: '🥷', accentColor: '#06b6d4', skinTone: '#e2e8f0', hairColor: '#0f172a', bodyColor: '#1e293b' },
  { id: 'wizard', name: 'Dice Mage', emoji: '🧙', accentColor: '#8b5cf6', skinTone: '#fcd34d', hairColor: '#e0e7ff', bodyColor: '#4338ca' },
  { id: 'gamer', name: 'Pro Streamer', emoji: '🧑‍💻', accentColor: '#10b981', skinTone: '#ffedd5', hairColor: '#059669', bodyColor: '#065f46' },
  { id: 'hero', name: 'Super Hero', emoji: '🦸', accentColor: '#ef4444', skinTone: '#fed7aa', hairColor: '#1d4ed8', bodyColor: '#2563eb' },
  { id: 'tiger', name: 'Tiger Boss', emoji: '🐯', accentColor: '#f97316', skinTone: '#fed7aa', hairColor: '#ea580c', bodyColor: '#c2410c' },
  { id: 'robot', name: 'Mecha AI', emoji: '🤖', accentColor: '#38bdf8', skinTone: '#94a3b8', hairColor: '#0284c7', bodyColor: '#0f172a' },
];

export const ACCESSORIES: AccessoryAsset[] = [
  { id: 'none', name: 'None', emoji: '❌', offsetY: 0 },
  { id: 'crown', name: 'Royal Crown', emoji: '👑', offsetY: -32 },
  { id: 'headset', name: 'RGB Headset', emoji: '🎧', offsetY: -2 },
  { id: 'shades', name: 'Pixel Shades', emoji: '🕶️', offsetY: 0 },
  { id: 'party', name: 'Party Cone', emoji: '🥳', offsetY: -30 },
  { id: 'halo', name: 'Golden Halo', emoji: '😇', offsetY: -36 },
  { id: 'fire', name: 'Flame Crest', emoji: '🔥', offsetY: -34 },
  { id: 'trophy', name: 'Gold Trophy', emoji: '🏆', offsetY: -28 },
];

export const AURAS: AuraAsset[] = [
  { id: 'amber', name: 'Royal Amber', from: '#f59e0b', to: '#b45309', border: '#fcd34d', glow: 'rgba(245,158,11,0.5)' },
  { id: 'cyan', name: 'Cyber Neon', from: '#06b6d4', to: '#1e40af', border: '#67e8f9', glow: 'rgba(6,182,212,0.5)' },
  { id: 'emerald', name: 'Ludo Green', from: '#10b981', to: '#065f46', border: '#6ee7b7', glow: 'rgba(16,185,129,0.5)' },
  { id: 'purple', name: 'Cosmic Violet', from: '#8b5cf6', to: '#4c1d95', border: '#c4b5fd', glow: 'rgba(139,92,246,0.5)' },
  { id: 'rose', name: 'Crimson Fury', from: '#f43f5e', to: '#9f1239', border: '#fda4af', glow: 'rgba(244,63,94,0.5)' },
  { id: 'slate', name: 'Shadow Steel', from: '#475569', to: '#0f172a', border: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
];

export const EXPRESSIONS: ExpressionAsset[] = [
  { id: 'cool', name: 'Cool', emoji: '😎' },
  { id: 'laugh', name: 'Laughing', emoji: '😄' },
  { id: 'fire', name: 'Fired Up', emoji: '🔥' },
  { id: 'wink', name: 'Wink', emoji: '😉' },
  { id: 'star', name: 'Star-Struck', emoji: '🤩' },
  { id: 'crown', name: 'Royal', emoji: '👑' },
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  characterId: 'king',
  accessoryId: 'crown',
  auraId: 'amber',
  expressionId: 'cool',
};

/**
 * Generates an SVG Data URI from an avatar configuration
 */
export function generateAvatarSvg(config: AvatarConfig): string {
  const char = CHARACTERS.find(c => c.id === config.characterId) || CHARACTERS[0];
  const acc = ACCESSORIES.find(a => a.id === config.accessoryId) || ACCESSORIES[0];
  const aura = AURAS.find(a => a.id === config.auraId) || AURAS[0];
  const expr = EXPRESSIONS.find(e => e.id === config.expressionId) || EXPRESSIONS[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="auraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${aura.from}" />
      <stop offset="100%" stop-color="${aura.to}" />
    </linearGradient>
    <radialGradient id="innerGlow" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Aura Circle -->
  <circle cx="80" cy="80" r="76" fill="url(#auraGrad)" stroke="${aura.border}" stroke-width="4" filter="url(#shadow)" />
  <circle cx="80" cy="80" r="74" fill="url(#innerGlow)" />

  <!-- Character Body / Clothes -->
  <path d="M 36 150 C 36 112 52 104 80 104 C 108 104 124 112 124 150 Z" fill="${char.bodyColor}" stroke="#0f172a" stroke-width="3" />
  <!-- Collar / Emblem -->
  <polygon points="80,108 72,122 88,122" fill="${char.accentColor}" stroke="#0f172a" stroke-width="1.5" />

  <!-- Character Head -->
  <circle cx="80" cy="68" r="32" fill="${char.skinTone}" stroke="#0f172a" stroke-width="3" />

  <!-- Hair / Head Feature -->
  <path d="M 48 64 C 48 38 60 36 80 36 C 100 36 112 38 112 64 C 106 50 94 48 80 48 C 66 48 54 50 48 64 Z" fill="${char.hairColor}" />

  <!-- Eyes -->
  <ellipse cx="68" cy="68" rx="4" ry="5.5" fill="#0f172a" />
  <circle cx="69.5" cy="66" r="1.5" fill="#ffffff" />
  <ellipse cx="92" cy="68" rx="4" ry="5.5" fill="#0f172a" />
  <circle cx="93.5" cy="66" r="1.5" fill="#ffffff" />

  <!-- Eyebrows -->
  <path d="M 63 58 Q 68 56 73 58" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M 87 58 Q 92 56 97 58" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />

  <!-- Smile / Mouth -->
  <path d="M 72 80 Q 80 88 88 80" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <!-- Blush -->
  <circle cx="60" cy="76" r="4.5" fill="#f43f5e" opacity="0.35" />
  <circle cx="100" cy="76" r="4.5" fill="#f43f5e" opacity="0.35" />

  <!-- Accessory Emoji / Vector Overlay -->
  ${
    acc.id !== 'none'
      ? `<text x="80" y="${68 + acc.offsetY}" font-size="34" text-anchor="middle" dominant-baseline="central" filter="url(#shadow)">${acc.emoji}</text>`
      : ''
  }

  <!-- Mood Badge (Bottom Right) -->
  <circle cx="120" cy="120" r="17" fill="#090d1a" stroke="${aura.border}" stroke-width="2.5" />
  <text x="120" y="122" font-size="16" text-anchor="middle" dominant-baseline="central">${expr.emoji}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_CARTOON_AVATARS: Array<{ name: string; config: AvatarConfig }> = [
  { name: 'Royal King', config: { characterId: 'king', accessoryId: 'crown', auraId: 'amber', expressionId: 'cool' } },
  { name: 'Empress', config: { characterId: 'queen', accessoryId: 'halo', auraId: 'purple', expressionId: 'star' } },
  { name: 'Cyber Ninja', config: { characterId: 'ninja', accessoryId: 'shades', auraId: 'cyan', expressionId: 'fire' } },
  { name: 'Pro Gamer', config: { characterId: 'gamer', accessoryId: 'headset', auraId: 'emerald', expressionId: 'laugh' } },
  { name: 'Dice Sorcerer', config: { characterId: 'wizard', accessoryId: 'fire', auraId: 'purple', expressionId: 'star' } },
  { name: 'Gold Champion', config: { characterId: 'hero', accessoryId: 'trophy', auraId: 'amber', expressionId: 'crown' } },
  { name: 'Tiger Striker', config: { characterId: 'tiger', accessoryId: 'crown', auraId: 'rose', expressionId: 'fire' } },
  { name: 'Mecha Bot', config: { characterId: 'robot', accessoryId: 'headset', auraId: 'cyan', expressionId: 'wink' } },
];
