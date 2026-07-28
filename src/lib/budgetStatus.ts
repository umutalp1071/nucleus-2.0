interface Spend {
  daily: number;
  weekly: number;
  monthly: number;
}

const APPROACHING_THRESHOLD = 0.8;

export function isApproaching(spend: Spend, caps: Spend): boolean {
  return (
    spend.daily / caps.daily >= APPROACHING_THRESHOLD ||
    spend.weekly / caps.weekly >= APPROACHING_THRESHOLD ||
    spend.monthly / caps.monthly >= APPROACHING_THRESHOLD
  );
}
