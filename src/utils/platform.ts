/**
 * Cross-platform detection and environment utilities.
 * Handles Web PWA, Android, iOS, and macOS runtime detection.
 */

export interface PlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  isStandalone: boolean;
  isTouchDevice: boolean;
  platformName: 'Android' | 'iOS' | 'macOS' | 'Windows' | 'Web';
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isMacOS: false,
      isWindows: false,
      isStandalone: false,
      isTouchDevice: false,
      platformName: 'Web',
    };
  }

  const ua = navigator.userAgent.toLowerCase();

  const isAndroid = /android/.test(ua);
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMacOS = /macintosh|mac os x/.test(ua) && !isIOS;
  const isWindows = /windows nt/.test(ua);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://');

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  let platformName: 'Android' | 'iOS' | 'macOS' | 'Windows' | 'Web' = 'Web';
  if (isAndroid) platformName = 'Android';
  else if (isIOS) platformName = 'iOS';
  else if (isMacOS) platformName = 'macOS';
  else if (isWindows) platformName = 'Windows';

  return {
    isAndroid,
    isIOS,
    isMacOS,
    isWindows,
    isStandalone,
    isTouchDevice,
    platformName,
  };
}
