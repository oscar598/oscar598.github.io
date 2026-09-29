// On phones, tilting the device tilts gravity in every physics scene.
// iOS requires a tap to grant motion access, so we ask on the first touch.

import { isTouch } from "./util.js";
import { setTilt } from "./world.js";

export function initTilt() {
  if (!isTouch || !("DeviceOrientationEvent" in window)) return;

  const listen = () => {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      // gamma: left/right tilt (-90..90), beta: front/back (-180..180)
      const x = Math.max(-1, Math.min(1, e.gamma / 45));
      const y = Math.max(0.3, Math.min(1, e.beta / 60));
      setTilt(x, y);
    });
  };

  const needsPermission = typeof DeviceOrientationEvent.requestPermission === "function";
  if (!needsPermission) {
    listen();
    return;
  }
  const ask = () => {
    DeviceOrientationEvent.requestPermission()
      .then((state) => state === "granted" && listen())
      .catch(() => {});
    window.removeEventListener("touchend", ask);
  };
  window.addEventListener("touchend", ask, { once: true });
}
