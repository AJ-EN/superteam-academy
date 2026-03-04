export const APP_NAME = 'Superteam Academy' as const;
export const APP_DESCRIPTION = 'Learn Solana Development. Earn On-Chain Credentials.' as const;

export const SOLANA_NETWORK = 'devnet' as const;
export const SOLANA_RPC_URL = 'https://api.devnet.solana.com' as const;

export const XP_PER_LESSON = 25 as const;
export const XP_PER_COURSE = 500 as const;

/** Returns the level for a given XP total. Level 0 starts at 0 XP. */
export const LEVEL_FORMULA = (xp: number): number => Math.floor(Math.sqrt(xp / 100));
