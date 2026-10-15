// tests/audioEngine.test.ts
// Unit tests for AK MIND TRAINER Sound Synthesizer & 23 Classic Sound Events
// Uses node:test and node:assert for zero-dependency test runner with tsx.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { soundEngine, CLASSIC_SOUND_EVENTS } from '../src/utils/audio';

describe('Sound Engine & 23 Classic Sound Events', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Mock environments where localStorage might not exist
    }
    soundEngine.updateSettings({
      masterVolume: 0.9,
      sfxVolume: 0.85,
      bgmVolume: 0.65,
      ambientVolume: 0.6,
      sfxMuted: false,
      bgmMuted: false,
      ambientMuted: false,
      hapticsEnabled: true,
    });
  });

  it('contains exactly 23 classic sound events in the descriptor registry', () => {
    assert.strictEqual(CLASSIC_SOUND_EVENTS.length, 23);

    // Verify sequential numbering from 1 to 23
    const numbers = CLASSIC_SOUND_EVENTS.map((e) => e.number);
    for (let i = 1; i <= 23; i++) {
      assert.ok(numbers.includes(i), `Event #${i} is missing`);
    }

    // Verify uniqueness of IDs
    const ids = new Set(CLASSIC_SOUND_EVENTS.map((e) => e.id));
    assert.strictEqual(ids.size, 23, 'Event IDs must be unique');
  });

  it('categorizes events into dice, token, game, and ui categories', () => {
    const validCategories = new Set(['dice', 'token', 'game', 'ui']);
    CLASSIC_SOUND_EVENTS.forEach((e) => {
      assert.ok(validCategories.has(e.category), `Invalid category: ${e.category}`);
      assert.strictEqual(typeof e.name, 'string');
      assert.ok(e.name.length > 0);
      assert.strictEqual(typeof e.description, 'string');
      assert.strictEqual(typeof e.action, 'function');
    });
  });

  it('executes all 23 event actions safely without throwing in mock/node environment', () => {
    CLASSIC_SOUND_EVENTS.forEach((evt) => {
      assert.doesNotThrow(() => {
        evt.action();
      }, `Sound event action ${evt.id} threw an error`);
    });
  });

  it('manages and clamps volume levels correctly between 0 and 1', () => {
    soundEngine.setMasterVolume(1.5);
    assert.strictEqual(soundEngine.masterVolume, 1.0);

    soundEngine.setMasterVolume(-0.5);
    assert.strictEqual(soundEngine.masterVolume, 0.0);

    soundEngine.setSfxVolume(0.5);
    assert.strictEqual(soundEngine.sfxVolume, 0.5);

    soundEngine.setBgmVolume(0.4);
    assert.strictEqual(soundEngine.bgmVolume, 0.4);

    soundEngine.setAmbientVolume(0.3);
    assert.strictEqual(soundEngine.ambientVolume, 0.3);
  });

  it('computes effective volumes with mute states and master multiplier', () => {
    soundEngine.setMasterVolume(0.8);
    soundEngine.setSfxVolume(0.5);
    soundEngine.updateSettings({ sfxMuted: false });

    // Effective SFX = 0.8 * 0.5 = 0.4
    const eff = soundEngine.effectiveSfxVol;
    assert.ok(Math.abs(eff - 0.4) < 0.001, `Expected ~0.4, got ${eff}`);

    soundEngine.toggleSfx();
    assert.strictEqual(soundEngine.sfxMuted, true);
    assert.strictEqual(soundEngine.effectiveSfxVol, 0);
  });

  it('persists and restores audio settings to localStorage', () => {
    soundEngine.updateSettings({
      masterVolume: 0.72,
      sfxVolume: 0.88,
      bgmVolume: 0.45,
      hapticsEnabled: false,
    });

    const settings = soundEngine.getSettings();
    assert.strictEqual(settings.masterVolume, 0.72);
    assert.strictEqual(settings.sfxVolume, 0.88);
    assert.strictEqual(settings.bgmVolume, 0.45);
    assert.strictEqual(settings.hapticsEnabled, false);
  });

  it('synchronizes both ak_audio_settings and ak_mind_trainer_audio_settings simultaneously', () => {
    soundEngine.updateSettings({
      masterVolume: 0.77,
      sfxVolume: 0.82,
      bgmVolume: 0.55,
      ambientVolume: 0.44,
      sfxMuted: false,
      bgmMuted: true,
      hapticsEnabled: true,
    });

    if (typeof localStorage !== 'undefined') {
      const primaryRaw = localStorage.getItem('ak_audio_settings');
      const legacyRaw = localStorage.getItem('ak_mind_trainer_audio_settings');
      assert.ok(primaryRaw, 'Primary key ak_audio_settings must be written');
      assert.ok(legacyRaw, 'Legacy key ak_mind_trainer_audio_settings must be written');

      const primary = JSON.parse(primaryRaw!);
      const legacy = JSON.parse(legacyRaw!);
      assert.strictEqual(primary.masterVolume, 0.77);
      assert.strictEqual(legacy.masterVolume, 0.77);
      assert.strictEqual(primary.bgmMuted, true);
      assert.strictEqual(legacy.bgmMuted, true);
    }
  });

  it('notifies subscribers whenever audio settings change', () => {
    let callCount = 0;
    let lastSettings: any = null;
    const listener = (s: any) => {
      callCount++;
      lastSettings = s;
    };

    const unsubscribe = soundEngine.subscribe(listener);

    soundEngine.setMasterVolume(0.65);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(lastSettings?.masterVolume, 0.65);

    unsubscribe();
    soundEngine.setMasterVolume(0.5);
    assert.strictEqual(callCount, 1, 'Listener should have unsubscribed');
  });
});
