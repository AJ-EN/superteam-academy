import type { Credential, SolanaNetwork } from '@/types';
import type { DasAsset, DasGetAssetsByOwnerResponse } from '../learning/types';
import { SOLANA_NETWORK } from '@/lib/constants';

// ─── Environment ─────────────────────────────────────────────────────────────

/** Helius API key — server-side only (not prefixed with NEXT_PUBLIC_). */
const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';

/**
 * Metaplex Core collection address for academy credentials.
 * All course-completion NFTs belong to this collection.
 * Set after deploying the collection with `mpl-core`.
 */
const ACADEMY_COLLECTION_ADDRESS =
  process.env.NEXT_PUBLIC_ACADEMY_COLLECTION_ADDRESS ?? '';

/** Helius DAS RPC endpoints per Solana network. */
const HELIUS_DAS_ENDPOINT: Record<string, string> = {
  devnet: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  'mainnet-beta': `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  // Testnet has no Helius support; fall back to public RPC (DAS unavailable).
  testnet: 'https://api.testnet.solana.com',
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches academy credentials (Metaplex Core NFTs) using the Helius
 * Digital Asset Standard (DAS) API.
 *
 * Credentials are Metaplex Core assets minted by the academy program upon
 * course completion. Each asset belongs to the `ACADEMY_COLLECTION_ADDRESS`
 * collection, making them easy to filter from a learner's full NFT inventory.
 */
export class CredentialService {
  private readonly dasUrl: string;

  constructor() {
    this.dasUrl = HELIUS_DAS_ENDPOINT[SOLANA_NETWORK] ?? HELIUS_DAS_ENDPOINT.devnet;
  }

  /**
   * Fetch all academy credentials owned by a wallet.
   *
   * Calls `getAssetsByOwner` on the Helius DAS API and filters results to
   * assets belonging to the `ACADEMY_COLLECTION_ADDRESS` collection.
   *
   * @param walletAddress - Base58 public key of the NFT owner.
   * @returns Array of `Credential` objects, sorted newest-first.
   *
   * @example
   * ```ts
   * const credentials = await credentialService.getCredentials(publicKey.toBase58());
   * ```
   */
  async getCredentials(walletAddress: string): Promise<Credential[]> {
    if (!HELIUS_API_KEY) {
      throw new Error(
        'CredentialService: HELIUS_API_KEY is not set. ' +
          'Get a free key at https://dev.helius.xyz/',
      );
    }

    // TODO (COLLECTION FILTER):
    // Once the Metaplex Core collection is deployed to devnet, set
    // NEXT_PUBLIC_ACADEMY_COLLECTION_ADDRESS and the filter below will
    // automatically apply. Until then all non-burnt assets are returned.

    const response = await fetch(this.dasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-academy-credentials',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
            showCollectionMetadata: true,
          },
          page: 1,
          limit: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `CredentialService: Helius DAS API returned ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as DasGetAssetsByOwnerResponse;

    const academyAssets = ACADEMY_COLLECTION_ADDRESS
      ? json.result.items.filter((asset) =>
          asset.grouping.some(
            (g) =>
              g.group_key === 'collection' &&
              g.group_value === ACADEMY_COLLECTION_ADDRESS,
          ),
        )
      : json.result.items;

    return academyAssets
      .filter((asset) => !asset.burnt)
      .map((asset) => mapAssetToCredential(asset, walletAddress))
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  /**
   * Fetch a single credential by mint/asset address.
   *
   * Uses Helius DAS `getAsset` and validates that the asset belongs to the
   * academy collection (when configured).
   */
  async getCredentialByMintAddress(mintAddress: string): Promise<Credential | null> {
    if (!HELIUS_API_KEY) return null;

    const response = await fetch(this.dasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-academy-credential',
        method: 'getAsset',
        params: { id: mintAddress },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `CredentialService: getAsset failed with ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as DasGetAssetResponse;
    const asset = json.result;

    if (!asset || asset.burnt) return null;

    if (ACADEMY_COLLECTION_ADDRESS) {
      const matchesCollection = asset.grouping.some(
        (g) =>
          g.group_key === 'collection' &&
          g.group_value === ACADEMY_COLLECTION_ADDRESS,
      );
      if (!matchesCollection) return null;
    }

    return mapAssetToCredential(asset, asset.ownership.owner);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a raw DAS asset to the app's `Credential` shape.
 *
 * Name convention for academy NFTs: `"Superteam Academy: <Course Title>"`
 * Slug is derived by lowercasing + replacing spaces with hyphens.
 *
 * TODO: For production, store `course_slug` as an on-chain NFT attribute
 * (Metaplex Core attribute plugin) instead of deriving it from the name.
 */
function mapAssetToCredential(asset: DasAsset, walletAddress: string): Credential {
  const name = asset.content.metadata.name ?? '';
  const courseTitle = name.replace(/^Superteam Academy:\s*/i, '').trim();
  const courseSlug = courseTitle.toLowerCase().replace(/\s+/g, '-');

  return {
    id: asset.id,
    userId: walletAddress,
    courseId: courseSlug,
    course: {
      id: courseSlug,
      title: courseTitle,
      slug: courseSlug,
      thumbnailUrl: asset.content.metadata.image ?? '',
    },
    mintAddress: asset.id,
    // DAS `getAssetsByOwner` does not return the original mint tx signature.
    // Use `getAsset` with the specific asset ID to retrieve transaction history.
    txSignature: '',
    metadataUri: asset.content.json_uri,
    issuedAt: asset.created_at ?? new Date(0).toISOString(),
    network: SOLANA_NETWORK as SolanaNetwork,
  };
}

interface DasGetAssetResponse {
  jsonrpc: '2.0';
  id: string;
  result: DasAsset | null;
}
