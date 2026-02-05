/**
 * useMediaPermissions Hook
 * Handles camera and microphone permission requests across platforms
 * Provides platform-specific instructions for iOS/Android settings
 */

import { useState, useEffect, useCallback } from 'react';
import type { MediaPermissions, PermissionStatus, Platform, PermissionInstructions } from '@/lib/diy/types';

// ─────────────────────────────────────────────────────────────
// Platform Detection
// ─────────────────────────────────────────────────────────────

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';

  const ua = navigator.userAgent.toLowerCase();

  // iOS detection (iPhone, iPad, iPod)
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }

  // Android detection
  if (/android/.test(ua)) {
    return 'android';
  }

  // Desktop detection (Electron, Tauri, etc.)
  if (/electron|tauri/.test(ua) || (window as any).electronAPI) {
    return 'desktop';
  }

  return 'web';
}

// ─────────────────────────────────────────────────────────────
// Platform-Specific Instructions
// ─────────────────────────────────────────────────────────────

const PERMISSION_INSTRUCTIONS: Record<Platform, PermissionInstructions> = {
  ios: {
    platform: 'ios',
    camera: 'Open Settings > A.I.M.S. > Camera > Enable',
    microphone: 'Open Settings > A.I.M.S. > Microphone > Enable',
  },
  android: {
    platform: 'android',
    camera: 'Open Settings > Apps > A.I.M.S. > Permissions > Camera > Allow',
    microphone: 'Open Settings > Apps > A.I.M.S. > Permissions > Microphone > Allow',
  },
  web: {
    platform: 'web',
    camera: 'Click the camera icon in your browser\'s address bar and select "Allow"',
    microphone: 'Click the microphone icon in your browser\'s address bar and select "Allow"',
  },
  desktop: {
    platform: 'desktop',
    camera: 'Open System Preferences > Security & Privacy > Camera > Enable A.I.M.S.',
    microphone: 'Open System Preferences > Security & Privacy > Microphone > Enable A.I.M.S.',
  },
};

// ─────────────────────────────────────────────────────────────
// Permission Status Checking
// ─────────────────────────────────────────────────────────────

async function checkPermissionStatus(name: 'camera' | 'microphone'): Promise<PermissionStatus> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'unavailable';
  }

  try {
    // Map to Permissions API names
    const permissionName = name === 'camera' ? 'camera' : 'microphone';
    const result = await navigator.permissions.query({ name: permissionName as PermissionName });

    switch (result.state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
      default:
        return 'prompt';
    }
  } catch {
    // Permissions API not supported for this permission
    // Try to determine status via MediaDevices API
    return 'prompt';
  }
}

// ─────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────

export interface UseMediaPermissionsReturn {
  permissions: MediaPermissions;
  platform: Platform;
  instructions: PermissionInstructions;
  isChecking: boolean;
  error: string | null;
  requestCamera: () => Promise<boolean>;
  requestMicrophone: () => Promise<boolean>;
  requestBoth: () => Promise<{ camera: boolean; microphone: boolean }>;
  recheckPermissions: () => Promise<void>;
  openSystemSettings: () => void;
}

export function useMediaPermissions(): UseMediaPermissionsReturn {
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: 'prompt',
    microphone: 'prompt',
  });
  const [platform, setPlatform] = useState<Platform>('web');
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Initialize and check permissions
  // ─────────────────────────────────────────────────────────

  const recheckPermissions = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const [cameraStatus, micStatus] = await Promise.all([
        checkPermissionStatus('camera'),
        checkPermissionStatus('microphone'),
      ]);

      setPermissions({
        camera: cameraStatus,
        microphone: micStatus,
      });
    } catch (err) {
      setError('Failed to check permissions');
      console.error('[useMediaPermissions] Error:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    setPlatform(detectPlatform());
    recheckPermissions();
  }, [recheckPermissions]);

  // ─────────────────────────────────────────────────────────
  // Request Camera Permission
  // ─────────────────────────────────────────────────────────

  const requestCamera = useCallback(async (): Promise<boolean> => {
    setError(null);

    // Check if already granted
    if (permissions.camera === 'granted') {
      return true;
    }

    // Check if denied (user must go to settings)
    if (permissions.camera === 'denied') {
      setError(`Camera access denied. ${PERMISSION_INSTRUCTIONS[platform].camera}`);
      return false;
    }

    try {
      // Request via getUserMedia to trigger browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Stop all tracks immediately (we just needed the permission)
      stream.getTracks().forEach(track => track.stop());

      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      return true;
    } catch (err: any) {
      console.error('[useMediaPermissions] Camera request failed:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
        setError(`Camera access denied. ${PERMISSION_INSTRUCTIONS[platform].camera}`);
      } else if (err.name === 'NotFoundError') {
        setPermissions(prev => ({ ...prev, camera: 'unavailable' }));
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }

      return false;
    }
  }, [permissions.camera, platform]);

  // ─────────────────────────────────────────────────────────
  // Request Microphone Permission
  // ─────────────────────────────────────────────────────────

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (permissions.microphone === 'granted') {
      return true;
    }

    if (permissions.microphone === 'denied') {
      setError(`Microphone access denied. ${PERMISSION_INSTRUCTIONS[platform].microphone}`);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch (err: any) {
      console.error('[useMediaPermissions] Microphone request failed:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
        setError(`Microphone access denied. ${PERMISSION_INSTRUCTIONS[platform].microphone}`);
      } else if (err.name === 'NotFoundError') {
        setPermissions(prev => ({ ...prev, microphone: 'unavailable' }));
        setError('No microphone found on this device.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }

      return false;
    }
  }, [permissions.microphone, platform]);

  // ─────────────────────────────────────────────────────────
  // Request Both Permissions
  // ─────────────────────────────────────────────────────────

  const requestBoth = useCallback(async (): Promise<{ camera: boolean; microphone: boolean }> => {
    setError(null);

    // If both already granted, return early
    if (permissions.camera === 'granted' && permissions.microphone === 'granted') {
      return { camera: true, microphone: true };
    }

    try {
      // Request both at once for better UX (single permission dialog)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      stream.getTracks().forEach(track => track.stop());

      setPermissions({ camera: 'granted', microphone: 'granted' });
      return { camera: true, microphone: true };
    } catch (err: any) {
      // If combined request fails, try individually
      console.warn('[useMediaPermissions] Combined request failed, trying individually');

      const cameraResult = await requestCamera();
      const micResult = await requestMicrophone();

      return { camera: cameraResult, microphone: micResult };
    }
  }, [permissions, requestCamera, requestMicrophone]);

  // ─────────────────────────────────────────────────────────
  // Open System Settings (platform-specific)
  // ─────────────────────────────────────────────────────────

  const openSystemSettings = useCallback(() => {
    switch (platform) {
      case 'ios':
        // iOS: Deep link to app settings
        window.location.href = 'app-settings:';
        break;
      case 'android':
        // Android: Intent to app settings (works in WebView/PWA)
        window.location.href = 'intent://settings#Intent;scheme=package;end';
        break;
      case 'desktop':
        // Desktop: Show instructions (can't open system settings directly)
        alert(`Please open your system settings:\n\n${PERMISSION_INSTRUCTIONS[platform].camera}\n\n${PERMISSION_INSTRUCTIONS[platform].microphone}`);
        break;
      case 'web':
      default:
        // Web: Guide user to browser settings
        alert(`To change permissions:\n\n1. Click the lock/info icon in your address bar\n2. Find "Camera" and "Microphone"\n3. Set both to "Allow"\n4. Refresh this page`);
        break;
    }
  }, [platform]);

  return {
    permissions,
    platform,
    instructions: PERMISSION_INSTRUCTIONS[platform],
    isChecking,
    error,
    requestCamera,
    requestMicrophone,
    requestBoth,
    recheckPermissions,
    openSystemSettings,
  };
}
