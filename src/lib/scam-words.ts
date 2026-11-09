// Words that usually mean a scam: paying before meeting, by methods that can't be reversed. A message that
// matches shows a warning in the conversation (it's still delivered).
export const RISKY_PAYMENT = /\b(gift ?cards?|wire (the |a )?(money|transfer|payment)|western union|moneygram|crypto|bitcoin|usdt|pay (a |the )?deposit (first|before)|advance payment|verification code|cashier'?s check)\b/i;
