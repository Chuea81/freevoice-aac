/**
 * Device performance detection for Kokoro TTS warnings.
 * Determines if a device is low-power based on available RAM and device characteristics.
 */

export interface DevicePerformanceInfo {
  isLowPower: boolean;
  ram: number | null; // in GB
  device: string;
  reason: string | null;
}

/**
 * Check if device is low-power (< 4GB RAM or matches low-power device patterns).
 * Returns performance info and recommendation.
 */
export function detectLowPowerDevice(): DevicePerformanceInfo {
  try {
    const ua = navigator.userAgent.toLowerCase();

    // Check for DeviceMemory API (available on Chrome Android)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory) {
      const ram = deviceMemory;
      if (ram < 4) {
        return {
          isLowPower: true,
          ram,
          device: 'Low-RAM device',
          reason: `Device has ${ram}GB RAM (Kokoro requires 4GB+)`,
        };
      }
    }

    // Check for specific low-power device patterns
    const lowPowerPatterns = [
      /motorola\s+[a-z0-9\s]+(?:g\d+|e\d+|one)/i, // Moto G, Moto E, Moto One series
      /samsung\s+galaxy\s+(?:a\d+|j\d+|m\d+|s20\s+fe)/i, // Budget Samsung lines
      /redmi/i, // Xiaomi budget line
      /realme\s+\d+/i, // Realme budget
      /note\s+\d+/i, // Redmi Note, etc.
      /android\s+(?:[789]|10|11)(?:\D|$)/i, // Android 7-11 on older devices
    ];

    if (lowPowerPatterns.some(p => p.test(ua))) {
      return {
        isLowPower: true,
        ram: null,
        device: 'Budget/Older Android device',
        reason: 'This device may experience lag with AI voices. Device voice has no lag.',
      };
    }

    return {
      isLowPower: false,
      ram: deviceMemory || null,
      device: 'Modern device',
      reason: null,
    };
  } catch {
    return {
      isLowPower: false,
      ram: null,
      device: 'Unknown',
      reason: null,
    };
  }
}
