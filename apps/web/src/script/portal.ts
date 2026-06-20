const MAC_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export function isValidMac(mac: string): boolean {
  return MAC_REGEX.test(mac);
}

export function normalizeMac(mac: string): string {
  return mac.trim().toLowerCase().replace(/-/g, ":");
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function mapRedeemError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already redeemed")) return "This voucher has already been used.";
  if (lower.includes("expired")) return "This voucher has expired.";
  if (lower.includes("not found")) return "Invalid voucher code. Please check and try again.";
  if (lower.includes("not valid for this location")) return "This voucher is not valid at this venue.";
  if (lower.includes("mac")) return "Invalid device identifier. Reconnect to Wi-Fi and try again.";
  return message;
}
