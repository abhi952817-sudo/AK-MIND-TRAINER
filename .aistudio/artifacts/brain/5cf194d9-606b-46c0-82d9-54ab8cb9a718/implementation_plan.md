# AK MIND TRAINER - Classic 23-Event Audio System & Sound Settings

Deliver a comprehensive, low-latency audio engine featuring 23 classic Ludo sound events, background music synthesis, dedicated audio settings with volume controls, and sound-cued normal-balanced bot gameplay.

### User Review & Critical Decisions

> [!IMPORTANT]
> The sound engine operates entirely via the browser's native Web Audio API (`AudioContext`), ensuring zero external asset loading failures, instant zero-latency playback across mobile and desktop, and zero network overhead.

- **Confirmed Decision 1**: Classic 23-event audio system and interactive sound settings modal are prioritized for this milestone.
- **Confirmed Decision 2**: Normal-balanced bot AI difficulty with natural pacing (500–900ms thinking delay) and distinct turn/move sound cues.
- **Sound Persistence**: Volume levels (Master, SFX, BGM) and mute toggles are saved to `localStorage` and restored automatically across game sessions.

---

### 1. Overview & Core Concept

- **What It Does**: Provides authentic, tactile audio feedback for every action in AK MIND TRAINER Ludo—including dice rolls, box-by-box token hops, yard releases, safe zone chimes, captures, countdown alerts, victory fanfares, and ambient gameplay melodies. Features a Sound Settings drawer/modal with real-time audio test triggers and level sliders.
- **Target Audience / Persona**: Casual and competitive players across mobile touchscreens and desktop browsers who want responsive, satisfying audio feedback and customizable sound levels.
- **Key Value**: Replaces silent or fragmented sound triggers with a rich, responsive 23-event soundscape that feels like a polished physical board game while maintaining accessible volume controls.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Audio Control Access**: Player taps the Sound/Speaker icon in the header or in-game pause/settings menu to open the Audio & Sound Settings modal.
2. **Real-time Adjustment**: Player adjusts SFX and Music volume sliders or toggles individual mutes; each adjustment plays an instant test sample (haptic + chime).
3. **In-Game Immersion**: During gameplay, every dice roll, hop, capture, turn alert, and victory is dynamically synchronized with spatial sound synthesis and subtle vibration.

#### Visual Identity & Theme
- **Aesthetic Direction**: Clean, tactile board-game interface adhering to the 2D casual games constitution. High-contrast controls without arbitrary pills or neon clutter.
- **Color Palette**:
  - Dominant Canvas: Deep game felt & midnight slate (`#0F172A`, `#1E293B`)
  - Structural Panels: Translucent frosted obsidian (`rgba(30, 41, 59, 0.94)`) with hairline borders (`rgba(255, 255, 255, 0.08)`)
  - Accent / Focus: Warm gold (`#F59E0B`) and emerald green (`#10B981`) for active sound states
- **Typography & Hierarchy**:
  - Display / Headings: `Plus Jakarta Sans`, SemiBold (18px–22px)
  - Body & Labels: `Plus Jakarta Sans`, Regular/Medium (14px–15px)
  - Numeric Values / Percentages: Tabular monospace (`font-mono tabular-nums`, 13px)
- **Component Styling & Layout**:
  - Modal: Centered dialog on desktop, bottom-sheet drawer on mobile viewports ($\le 640\text{px}$).
  - Controls: Slider bars with smooth drag handles, switch toggles with clear accessible labels, and an interactive 23-event Sound Test soundboard grid.
- **Interactive Feedback & Motion**:
  - Smooth slider responsiveness ($\le 50\text{ms}$ latency) with live gain node modulation.
  - Active audio waves/speaker icon micro-animations when audio is actively playing.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Synthesized Web Audio API vs. External Audio MP3 Files**
  - *Chosen Approach*: Pure programmatic audio synthesis using `OscillatorNode`, `GainNode`, `BiquadFilterNode`, and white-noise buffers via Web Audio API.
  - *Why*: Eliminates broken image/audio 404s, requires zero external CDN dependencies, loads with 0ms startup time, and functions fully offline across PWA, mobile WebViews, and desktop wrappers.
  - *Alternatives Considered*: Bundling heavy MP3/WAV files which increase bundle size and require complex preloaders.

- **Decision 2: Audio Preferences Storage**
  - *Chosen Approach*: Synchronous read/write from `localStorage` under `ak_audio_settings` key with safe JSON schema validation.
  - *Why*: Instant availability on page boot before the React tree mounts, avoiding audio pops or accidental blasting of audio on first user gesture.

- **Decision 3: Bot Audio Cues**
  - *Chosen Approach*: Normal-balanced bot actions (thinking, rolling, moving tokens) route through the exact same sound engine methods with subtle volume dampening (0.8x) so the player's own moves feel primary.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    AK MIND TRAINER UI                       │
│   ┌─────────────────────┐       ┌────────────────────────┐  │
│   │   GameScreen HUD    │       │  SoundSettingsModal    │  │
│   │ (Speaker / Mute Btn)│       │  (Sliders, Test Grid)  │  │
│   └──────────┬──────────┘       └───────────┬────────────┘  │
└──────────────┼──────────────────────────────┼───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SoundEngine (audio.ts)                    │
│  - Master Gain Node (0.0 to 1.0)                            │
│  - SFX Gain Node (0.0 to 1.0) & BGM Gain Node (0.0 to 1.0)  │
│  - 23 Synthesized Classic Event Methods                     │
│  - Procedural Ambient Melodies (Gameplay, Victory, Menu)    │
│  - LocalStorage Audio Preferences State Sync                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Web Audio API Context                   │
│   [Oscillators] ──► [Gain & Filter Nodes] ──► [AudioContext]│
└─────────────────────────────────────────────────────────────┘
```

#### The 23 Classic Sound Events
1. `DICE_ROLL_TAP` - Initial mechanical dice tap
2. `DICE_RATTLE` - Multi-frequency tumbling dice rattle
3. `DICE_LAND_VALUE` - Crisp stopping impact
4. `DICE_SIX_BONUS` - Euphoric high-pitch bonus chime
5. `TOKEN_RELEASE` - Cheerful rising arpeggio when token exits yard to track
6. `TOKEN_HOP_STEP` - Snappy wood/plastic step click for box-by-box movement
7. `TOKEN_SAFE_ZONE` - Resonant brass bell upon landing on a starred safe cell
8. `TOKEN_HOME_ENTRY` - Ascending 3-tone harmonic flourish into colored home corridor
9. `TOKEN_HOME_TRIUMPH` - Full bell chime when a token reaches the center triangle
10. `TOKEN_CAPTURE` - Dramatic dual-tone strike when knocking an opponent out
11. `TOKEN_BASE_RETURN` - Rapid descending whistle as captured token returns home
12. `TURN_START_ALERT` - Subtle prompt bell when human player's turn begins
13. `TURN_WARNING_TICK` - Urgent ticking pulse during final 5 seconds of turn timer
14. `TURN_TIMEOUT_BUZZ` - Low buzz if turn timer runs out
15. `BOT_THINKING` - Quiet gentle blips while AI computes tactical moves
16. `BUTTON_TAP` - Crisp tactile micro-click for UI buttons
17. `MODAL_OPEN` - Soft swoosh tone
18. `MODAL_CLOSE` - Reverse swoosh tone
19. `TOGGLE_SWITCH` - Mechanical toggle snap
20. `SLIDER_DRAG_TICK` - Subtle granular audio ticks during volume adjustment
21. `GAME_START_CHIME` - Warm opening chord when entering the arena
22. `VICTORY_FANFARE` - Multi-harmonic celebratory fanfare on game win
23. `GAME_OVER_THEME` - Gentle melodic closing cadence

#### State Model & Persistence
```typescript
interface AudioSettings {
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number;    // 0.0 - 1.0
  bgmVolume: number;    // 0.0 - 1.0
  sfxMuted: boolean;
  bgmMuted: boolean;
  hapticsEnabled: boolean;
}
```

---

### Verification & Testing Plan

1. **Unit Testing**:
   - Verify `soundEngine` state serialization and deserialization from `localStorage`.
   - Ensure all 23 audio event methods execute without throwing even when Web Audio context is uninitialized or suspended.
2. **Interactive Soundboard Testing**:
   - Open the Sound Settings modal and test each button in the 23-event test grid.
   - Verify slider dragging dynamically updates live volume without clipping or audio glitches.
3. **In-Game Verification**:
   - Run a full 4-player Ludo match against normal bots; confirm audio synchronization with token hops, captures, dice rolls, and turn switches.
   - Run `lint_applet` and `compile_applet` to ensure zero compilation or type errors.
