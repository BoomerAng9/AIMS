/**
 * Marketplace Adapters — Platform-Specific Integrations
 *
 * Provides unified interface for managing listings across:
 * - Shopify (DTC stores)
 * - Amazon (FBA/FBM)
 * - KDP (Kindle Direct Publishing)
 * - Etsy (Handmade/Vintage)
 * - eBay (Auctions/Buy It Now)
 * - Walmart Marketplace
 * - TikTok Shop
 *
 * Each adapter handles platform-specific quirks while exposing
 * a consistent API for the Seller Agent to use.
 */

import type {
  MarketplaceType,
  MarketplaceListing,
  SellerProduct,
  ProductVariant,
} from './seller-types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MarketplaceAdapter {
  type: MarketplaceType;
  name: string;

  // Connection
  connect(credentials: MarketplaceCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Listings
  createListing(product: SellerProduct): Promise<MarketplaceListing>;
  updateListing(listingId: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing>;
  deleteListing(listingId: string): Promise<void>;
  getListing(listingId: string): Promise<MarketplaceListing | null>;
  getAllListings(): Promise<MarketplaceListing[]>;
  syncListing(listingId: string): Promise<SyncResult>;

  // Inventory
  updateInventory(listingId: string, quantity: number): Promise<void>;
  getInventory(listingId: string): Promise<number>;

  // Orders
  getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]>;
  fulfillOrder(orderId: string, tracking: TrackingInfo): Promise<void>;

  // Analytics
  getPerformanceMetrics(listingId: string, period: TimePeriod): Promise<ListingMetrics>;
}

export interface MarketplaceCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  shopDomain?: string; // Shopify
  sellerId?: string; // Amazon
  publisherId?: string; // KDP
  storeId?: string;
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  shopInfo?: {
    name: string;
    id: string;
    plan?: string;
    url?: string;
  };
}

export interface SyncResult {
  success: boolean;
  changes: SyncChange[];
  errors: string[];
}

export interface SyncChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface OrderQueryParams {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface MarketplaceOrder {
  id: string;
  marketplace: MarketplaceType;
  status: string;
  customer: {
    name: string;
    email: string;
    address: ShippingAddress;
  };
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    fees: number;
    net: number;
  };
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  listingId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export interface ListingMetrics {
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  units: number;
  avgOrderValue: number;
  returnRate: number;
  reviewCount: number;
  avgRating: number;
}

export type TimePeriod = '7d' | '30d' | '90d' | '365d' | 'all';

// ─────────────────────────────────────────────────────────────
// Platform-Specific Configuration
// ─────────────────────────────────────────────────────────────

export interface ShopifyConfig {
  shop: string;
  apiVersion: string;
  scopes: string[];
}

export interface AmazonConfig {
  marketplaceId: string;
  region: 'NA' | 'EU' | 'FE';
  fulfillmentChannel: 'FBA' | 'FBM' | 'BOTH';
}

export interface KDPConfig {
  marketplace: 'US' | 'UK' | 'DE' | 'FR' | 'ES' | 'IT' | 'JP' | 'CA' | 'AU';
  contentType: 'ebook' | 'paperback' | 'hardcover' | 'audiobook';
  enrolledInKU: boolean; // Kindle Unlimited
}

export interface EtsyConfig {
  shopSection?: string;
  shippingProfileId?: string;
  returnPolicyId?: string;
}

// ─────────────────────────────────────────────────────────────
// Base Adapter Implementation
// ─────────────────────────────────────────────────────────────

abstract class BaseMarketplaceAdapter implements MarketplaceAdapter {
  abstract type: MarketplaceType;
  abstract name: string;

  protected connected = false;
  protected credentials: MarketplaceCredentials | null = null;

  isConnected(): boolean {
    return this.connected;
  }

  abstract connect(credentials: MarketplaceCredentials): Promise<ConnectionResult>;
  abstract disconnect(): Promise<void>;
  abstract createListing(product: SellerProduct): Promise<MarketplaceListing>;
  abstract updateListing(listingId: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing>;
  abstract deleteListing(listingId: string): Promise<void>;
  abstract getListing(listingId: string): Promise<MarketplaceListing | null>;
  abstract getAllListings(): Promise<MarketplaceListing[]>;
  abstract syncListing(listingId: string): Promise<SyncResult>;
  abstract updateInventory(listingId: string, quantity: number): Promise<void>;
  abstract getInventory(listingId: string): Promise<number>;
  abstract getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]>;
  abstract fulfillOrder(orderId: string, tracking: TrackingInfo): Promise<void>;
  abstract getPerformanceMetrics(listingId: string, period: TimePeriod): Promise<ListingMetrics>;

  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error(`${this.name} adapter is not connected. Call connect() first.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Shopify Adapter
// ─────────────────────────────────────────────────────────────

export class ShopifyAdapter extends BaseMarketplaceAdapter {
  type: MarketplaceType = 'shopify';
  name = 'Shopify';

  private config: ShopifyConfig = {
    shop: '',
    apiVersion: '2024-01',
    scopes: ['read_products', 'write_products', 'read_orders', 'read_inventory'],
  };

  private shopInfo: ConnectionResult['shopInfo'] | null = null;

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    this.credentials = credentials;

    // In production, this would make actual API calls
    // Simulating connection validation
    if (!credentials.accessToken || !credentials.shopDomain) {
      return {
        success: false,
        error: 'Missing required credentials: accessToken and shopDomain',
      };
    }

    this.config.shop = credentials.shopDomain;
    this.connected = true;
    this.shopInfo = {
      name: credentials.shopDomain.replace('.myshopify.com', ''),
      id: credentials.storeId || 'shop_' + Date.now(),
      plan: 'Basic',
      url: `https://${credentials.shopDomain}`,
    };

    return {
      success: true,
      shopInfo: this.shopInfo,
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.credentials = null;
    this.shopInfo = null;
  }

  async createListing(product: SellerProduct): Promise<MarketplaceListing> {
    this.ensureConnected();

    // Transform to Shopify product format
    const listing: MarketplaceListing = {
      id: `shopify_${Date.now()}`,
      productId: product.id,
      marketplace: 'shopify',
      listingId: '',
      listingUrl: `https://${this.config.shop}/products/${this.slugify(product.name)}`,
      title: product.name,
      description: product.description || '',
      price: product.basePrice ?? product.suggestedPrice,
      quantity: product.totalQuantity,
      fulfillment: 'merchant',
      status: 'pending',
      images: product.images.map(img => img.url),
      keywords: product.tags,
      lastSyncAt: new Date(),
    };

    // In production: POST to Shopify Admin API
    // const response = await fetch(`https://${this.config.shop}/admin/api/${this.config.apiVersion}/products.json`, {...})

    return listing;
  }

  async updateListing(
    listingId: string,
    updates: Partial<MarketplaceListing>
  ): Promise<MarketplaceListing> {
    this.ensureConnected();

    const existing = await this.getListing(listingId);
    if (!existing) throw new Error(`Listing ${listingId} not found`);

    const updated: MarketplaceListing = {
      ...existing,
      ...updates,
      lastSyncAt: new Date(),
    };

    // In production: PUT to Shopify Admin API

    return updated;
  }

  async deleteListing(listingId: string): Promise<void> {
    this.ensureConnected();
    // In production: DELETE to Shopify Admin API
  }

  async getListing(listingId: string): Promise<MarketplaceListing | null> {
    this.ensureConnected();
    // In production: GET from Shopify Admin API
    return null;
  }

  async getAllListings(): Promise<MarketplaceListing[]> {
    this.ensureConnected();
    // In production: GET all products from Shopify Admin API
    return [];
  }

  async syncListing(listingId: string): Promise<SyncResult> {
    this.ensureConnected();
    // Sync local listing with Shopify
    return { success: true, changes: [], errors: [] };
  }

  async updateInventory(listingId: string, quantity: number): Promise<void> {
    this.ensureConnected();
    // In production: PUT to Shopify Inventory API
  }

  async getInventory(listingId: string): Promise<number> {
    this.ensureConnected();
    return 0;
  }

  async getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]> {
    this.ensureConnected();
    // In production: GET from Shopify Orders API
    return [];
  }

  async fulfillOrder(orderId: string, tracking: TrackingInfo): Promise<void> {
    this.ensureConnected();
    // In production: POST fulfillment to Shopify
  }

  async getPerformanceMetrics(
    listingId: string,
    period: TimePeriod
  ): Promise<ListingMetrics> {
    this.ensureConnected();
    // Aggregate from Shopify Analytics
    return {
      views: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      units: 0,
      avgOrderValue: 0,
      returnRate: 0,
      reviewCount: 0,
      avgRating: 0,
    };
  }

  // Shopify-specific methods
  async createCollection(name: string, productIds: string[]): Promise<string> {
    this.ensureConnected();
    // Create a custom collection
    return `collection_${Date.now()}`;
  }

  async setUpDiscounts(params: {
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    code?: string;
    automatic?: boolean;
    minPurchase?: number;
  }): Promise<string> {
    this.ensureConnected();
    // Create discount code or automatic discount
    return `discount_${Date.now()}`;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

// ─────────────────────────────────────────────────────────────
// Amazon Adapter
// ─────────────────────────────────────────────────────────────

export class AmazonAdapter extends BaseMarketplaceAdapter {
  type: MarketplaceType = 'amazon';
  name = 'Amazon Seller Central';

  private config: AmazonConfig = {
    marketplaceId: 'ATVPDKIKX0DER', // US
    region: 'NA',
    fulfillmentChannel: 'FBA',
  };

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    this.credentials = credentials;

    if (!credentials.sellerId || !credentials.accessToken) {
      return {
        success: false,
        error: 'Missing required credentials: sellerId and accessToken',
      };
    }

    this.connected = true;

    return {
      success: true,
      shopInfo: {
        name: 'Amazon Seller',
        id: credentials.sellerId,
      },
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.credentials = null;
  }

  async createListing(product: SellerProduct): Promise<MarketplaceListing> {
    this.ensureConnected();

    // Amazon requires ASIN or UPC for existing products
    // New products go through Brand Registry process

    const listing: MarketplaceListing = {
      id: `amazon_${Date.now()}`,
      productId: product.id,
      marketplace: 'amazon',
      listingId: '', // ASIN assigned by Amazon
      listingUrl: '',
      title: this.formatAmazonTitle(product),
      description: product.description || '',
      price: product.basePrice ?? product.suggestedPrice,
      quantity: product.totalQuantity,
      fulfillment: 'merchant',
      status: 'pending', // Amazon reviews new listings
      images: product.images.map(img => img.url),
      keywords: product.tags,
      lastSyncAt: new Date(),
    };

    return listing;
  }

  async updateListing(
    listingId: string,
    updates: Partial<MarketplaceListing>
  ): Promise<MarketplaceListing> {
    this.ensureConnected();
    const existing = await this.getListing(listingId);
    if (!existing) throw new Error(`Listing ${listingId} not found`);

    return { ...existing, ...updates, lastSyncAt: new Date() };
  }

  async deleteListing(listingId: string): Promise<void> {
    this.ensureConnected();
    // Amazon doesn't truly delete - just sets to inactive
  }

  async getListing(listingId: string): Promise<MarketplaceListing | null> {
    this.ensureConnected();
    return null;
  }

  async getAllListings(): Promise<MarketplaceListing[]> {
    this.ensureConnected();
    return [];
  }

  async syncListing(listingId: string): Promise<SyncResult> {
    this.ensureConnected();
    return { success: true, changes: [], errors: [] };
  }

  async updateInventory(listingId: string, quantity: number): Promise<void> {
    this.ensureConnected();
    // Use Amazon Inventory API
  }

  async getInventory(listingId: string): Promise<number> {
    this.ensureConnected();
    return 0;
  }

  async getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]> {
    this.ensureConnected();
    return [];
  }

  async fulfillOrder(orderId: string, tracking: TrackingInfo): Promise<void> {
    this.ensureConnected();
    // For FBM orders only - FBA handled by Amazon
  }

  async getPerformanceMetrics(
    listingId: string,
    period: TimePeriod
  ): Promise<ListingMetrics> {
    this.ensureConnected();
    return {
      views: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      units: 0,
      avgOrderValue: 0,
      returnRate: 0,
      reviewCount: 0,
      avgRating: 0,
    };
  }

  // Amazon-specific methods
  async submitFBAShipment(params: {
    shipmentName: string;
    destinationFulfillmentCenter: string;
    items: { sku: string; quantity: number }[];
  }): Promise<string> {
    this.ensureConnected();
    return `shipment_${Date.now()}`;
  }

  async getSearchTermsReport(asin: string): Promise<{
    searchTerms: { term: string; impressions: number; clicks: number }[];
  }> {
    this.ensureConnected();
    return { searchTerms: [] };
  }

  async updateBackendKeywords(asin: string, keywords: string[]): Promise<void> {
    this.ensureConnected();
    // Update search terms in Seller Central
  }

  async createAPlusContent(asin: string, modules: unknown[]): Promise<void> {
    this.ensureConnected();
    // Submit A+ Content for review
  }

  private formatAmazonTitle(product: SellerProduct): string {
    // Amazon title best practices: Brand + Product + Key Features + Size/Quantity
    const parts: string[] = [];

    if (product.brand) parts.push(product.brand);
    parts.push(product.name);

    // Add key attributes
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      if (variant.attributes) {
        Object.values(variant.attributes).slice(0, 2).forEach((attr) => {
          if (typeof attr === 'string') parts.push(attr);
        });
      }
    }

    return parts.join(' - ').slice(0, 200); // Amazon limit
  }
}

// ─────────────────────────────────────────────────────────────
// KDP (Kindle Direct Publishing) Adapter
// ─────────────────────────────────────────────────────────────

export class KDPAdapter extends BaseMarketplaceAdapter {
  type: MarketplaceType = 'kdp';
  name = 'Kindle Direct Publishing';

  private config: KDPConfig = {
    marketplace: 'US',
    contentType: 'ebook',
    enrolledInKU: false,
  };

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    this.credentials = credentials;

    if (!credentials.publisherId) {
      return {
        success: false,
        error: 'Missing required credential: publisherId',
      };
    }

    this.connected = true;

    return {
      success: true,
      shopInfo: {
        name: 'KDP Publisher',
        id: credentials.publisherId,
      },
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.credentials = null;
  }

  async createListing(product: SellerProduct): Promise<MarketplaceListing> {
    this.ensureConnected();

    // KDP-specific listing (book)
    const listing: MarketplaceListing = {
      id: `kdp_${Date.now()}`,
      productId: product.id,
      marketplace: 'kdp',
      listingId: '', // ASIN assigned after publishing
      listingUrl: '',
      title: product.name,
      description: product.description || '',
      price: this.calculateKDPPrice(product.basePrice ?? product.suggestedPrice),
      quantity: -1, // Digital products have unlimited inventory
      fulfillment: 'marketplace', // KDP handles fulfillment
      status: 'pending',
      images: product.images.map(img => img.url), // Cover image
      keywords: product.tags?.slice(0, 7), // KDP allows 7 keywords
      lastSyncAt: new Date(),
    };

    return listing;
  }

  async updateListing(
    listingId: string,
    updates: Partial<MarketplaceListing>
  ): Promise<MarketplaceListing> {
    this.ensureConnected();
    const existing = await this.getListing(listingId);
    if (!existing) throw new Error(`Listing ${listingId} not found`);

    return { ...existing, ...updates, lastSyncAt: new Date() };
  }

  async deleteListing(listingId: string): Promise<void> {
    this.ensureConnected();
    // KDP books can be unpublished but not deleted
  }

  async getListing(listingId: string): Promise<MarketplaceListing | null> {
    this.ensureConnected();
    return null;
  }

  async getAllListings(): Promise<MarketplaceListing[]> {
    this.ensureConnected();
    return [];
  }

  async syncListing(listingId: string): Promise<SyncResult> {
    this.ensureConnected();
    return { success: true, changes: [], errors: [] };
  }

  async updateInventory(_listingId: string, _quantity: number): Promise<void> {
    // Digital products - no inventory management needed
  }

  async getInventory(_listingId: string): Promise<number> {
    return -1; // Unlimited for digital
  }

  async getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]> {
    this.ensureConnected();
    // KDP reports sales, not individual orders
    return [];
  }

  async fulfillOrder(_orderId: string, _tracking: TrackingInfo): Promise<void> {
    // Digital delivery - automatic
  }

  async getPerformanceMetrics(
    listingId: string,
    period: TimePeriod
  ): Promise<ListingMetrics> {
    this.ensureConnected();
    return {
      views: 0, // Page reads for KU
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      units: 0,
      avgOrderValue: 0,
      returnRate: 0, // Refund rate
      reviewCount: 0,
      avgRating: 0,
    };
  }

  // KDP-specific methods
  async enrollInKindleUnlimited(asin: string): Promise<void> {
    this.ensureConnected();
    this.config.enrolledInKU = true;
    // 90-day exclusivity commitment
  }

  async runKindleCountdownDeal(params: {
    asin: string;
    discountPrice: number;
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    this.ensureConnected();
    return `countdown_${Date.now()}`;
  }

  async runFreeBookPromotion(params: {
    asin: string;
    startDate: Date;
    days: 1 | 2 | 3 | 4 | 5; // KU gives 5 free days per 90-day period
  }): Promise<string> {
    this.ensureConnected();
    return `freepromo_${Date.now()}`;
  }

  async getKENPCReads(asin: string, period: TimePeriod): Promise<{
    pagesRead: number;
    estimatedRoyalty: number;
  }> {
    this.ensureConnected();
    return { pagesRead: 0, estimatedRoyalty: 0 };
  }

  async updateCategories(asin: string, categories: string[]): Promise<void> {
    this.ensureConnected();
    // Request category changes through KDP support
  }

  private calculateKDPPrice(basePrice: number): number {
    // KDP pricing tiers affect royalty rates
    // $2.99-9.99 = 70% royalty
    // Outside that range = 35% royalty

    if (basePrice < 2.99) return 2.99;
    if (basePrice > 9.99) return 9.99;
    return basePrice;
  }

  async calculateRoyalty(price: number, marketplace: string): Promise<{
    royaltyRate: number;
    deliveryCost: number;
    netRoyalty: number;
  }> {
    const royaltyRate = price >= 2.99 && price <= 9.99 ? 0.7 : 0.35;
    const deliveryCost = 0; // Simplified - actual varies by file size

    return {
      royaltyRate,
      deliveryCost,
      netRoyalty: price * royaltyRate - deliveryCost,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Etsy Adapter
// ─────────────────────────────────────────────────────────────

export class EtsyAdapter extends BaseMarketplaceAdapter {
  type: MarketplaceType = 'etsy';
  name = 'Etsy';

  private config: EtsyConfig = {};

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    this.credentials = credentials;

    if (!credentials.apiKey || !credentials.accessToken) {
      return {
        success: false,
        error: 'Missing required credentials: apiKey and accessToken',
      };
    }

    this.connected = true;

    return {
      success: true,
      shopInfo: {
        name: 'Etsy Shop',
        id: credentials.storeId || '',
        url: `https://etsy.com/shop/${credentials.storeId}`,
      },
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.credentials = null;
  }

  async createListing(product: SellerProduct): Promise<MarketplaceListing> {
    this.ensureConnected();

    const listing: MarketplaceListing = {
      id: `etsy_${Date.now()}`,
      productId: product.id,
      marketplace: 'etsy',
      listingId: '',
      listingUrl: '',
      title: product.name.slice(0, 140), // Etsy 140 char limit
      description: product.description || '',
      price: product.basePrice ?? product.suggestedPrice,
      quantity: product.totalQuantity,
      fulfillment: 'merchant',
      status: 'pending',
      images: product.images.slice(0, 10).map(img => img.url), // Etsy allows 10 images
      keywords: product.tags?.slice(0, 13), // Etsy allows 13 tags
      lastSyncAt: new Date(),
    };

    return listing;
  }

  async updateListing(
    listingId: string,
    updates: Partial<MarketplaceListing>
  ): Promise<MarketplaceListing> {
    this.ensureConnected();
    const existing = await this.getListing(listingId);
    if (!existing) throw new Error(`Listing ${listingId} not found`);

    return { ...existing, ...updates, lastSyncAt: new Date() };
  }

  async deleteListing(listingId: string): Promise<void> {
    this.ensureConnected();
  }

  async getListing(listingId: string): Promise<MarketplaceListing | null> {
    this.ensureConnected();
    return null;
  }

  async getAllListings(): Promise<MarketplaceListing[]> {
    this.ensureConnected();
    return [];
  }

  async syncListing(listingId: string): Promise<SyncResult> {
    this.ensureConnected();
    return { success: true, changes: [], errors: [] };
  }

  async updateInventory(listingId: string, quantity: number): Promise<void> {
    this.ensureConnected();
  }

  async getInventory(listingId: string): Promise<number> {
    this.ensureConnected();
    return 0;
  }

  async getOrders(params: OrderQueryParams): Promise<MarketplaceOrder[]> {
    this.ensureConnected();
    return [];
  }

  async fulfillOrder(orderId: string, tracking: TrackingInfo): Promise<void> {
    this.ensureConnected();
  }

  async getPerformanceMetrics(
    listingId: string,
    period: TimePeriod
  ): Promise<ListingMetrics> {
    this.ensureConnected();
    return {
      views: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      units: 0,
      avgOrderValue: 0,
      returnRate: 0,
      reviewCount: 0,
      avgRating: 0,
    };
  }

  // Etsy-specific methods
  async runSale(params: {
    discountPercent: number;
    listingIds?: string[];
    shopWide?: boolean;
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    this.ensureConnected();
    return `sale_${Date.now()}`;
  }

  async enableFreeShipping(listingIds: string[], threshold?: number): Promise<void> {
    this.ensureConnected();
    // Free shipping guarantee increases search visibility
  }

  async createCoupon(params: {
    code: string;
    type: 'percent' | 'fixed' | 'free_shipping';
    value: number;
    minPurchase?: number;
    expiresAt?: Date;
  }): Promise<string> {
    this.ensureConnected();
    return params.code;
  }

  async getShopStats(): Promise<{
    views: number;
    favorites: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    starSellerStatus: boolean;
  }> {
    this.ensureConnected();
    return {
      views: 0,
      favorites: 0,
      orders: 0,
      revenue: 0,
      conversionRate: 0,
      starSellerStatus: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Adapter Factory
// ─────────────────────────────────────────────────────────────

export function createMarketplaceAdapter(type: MarketplaceType): MarketplaceAdapter {
  switch (type) {
    case 'shopify':
      return new ShopifyAdapter();
    case 'amazon':
      return new AmazonAdapter();
    case 'kdp':
      return new KDPAdapter();
    case 'etsy':
      return new EtsyAdapter();
    default:
      throw new Error(`Unsupported marketplace: ${type}`);
  }
}

// Registry for managing multiple marketplace connections
export class MarketplaceRegistry {
  private adapters: Map<string, MarketplaceAdapter> = new Map();

  register(key: string, adapter: MarketplaceAdapter): void {
    this.adapters.set(key, adapter);
  }

  get(key: string): MarketplaceAdapter | undefined {
    return this.adapters.get(key);
  }

  getByType(type: MarketplaceType): MarketplaceAdapter | undefined {
    for (const adapter of Array.from(this.adapters.values())) {
      if (adapter.type === type) return adapter;
    }
    return undefined;
  }

  getAll(): MarketplaceAdapter[] {
    return Array.from(this.adapters.values());
  }

  getConnected(): MarketplaceAdapter[] {
    return this.getAll().filter((a) => a.isConnected());
  }

  async disconnectAll(): Promise<void> {
    for (const adapter of Array.from(this.adapters.values())) {
      if (adapter.isConnected()) {
        await adapter.disconnect();
      }
    }
  }
}

export default MarketplaceRegistry;
