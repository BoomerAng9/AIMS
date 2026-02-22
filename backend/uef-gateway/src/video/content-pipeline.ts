/**
 * Content Pipeline — Autonomous Video / UGC Generation
 *
 * End-to-end pipeline: Product URL → Crawl → Extract Assets →
 * Generate Creative Brief → Video Generation → Multi-Platform Export
 *
 * This is the "Amazon UGC" workflow: give it a product link and it
 * produces platform-ready marketing videos autonomously.
 *
 * Steps:
 *   1. Crawl product URL → extract title, images, description, price
 *   2. Generate creative brief via LLM (style, tone, hook, CTA)
 *   3. Select optimal video model based on requirements
 *   4. Submit video generation task to KIE.ai
 *   5. Poll for completion
 *   6. Format for target platforms (TikTok, Reels, YouTube Shorts, Meta Ads)
 *   7. Return deliverables
 */

import { kieVideo, type KieModel, type KieVideoRequest } from './kie-client';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentPipelineRequest {
  /** What to create content for — product URL, description, or raw prompt */
  source: string;
  /** Type of content source */
  sourceType: 'product-url' | 'description' | 'prompt';
  /** Target platforms for output formatting */
  platforms: Array<'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'meta-ads' | 'twitter' | 'generic'>;
  /** Video style preset */
  style: 'ugc-review' | 'product-showcase' | 'unboxing' | 'testimonial' | 'comparison' | 'cinematic' | 'auto';
  /** Preferred video model (or 'auto' for smart selection) */
  model: KieModel | 'auto';
  /** Duration in seconds */
  duration: number;
  /** Whether to include audio */
  withAudio: boolean;
  /** Brand voice / tone */
  tone?: string;
  /** User ID for tracking */
  userId: string;
  /** Optional custom hook line */
  hook?: string;
  /** Optional CTA */
  cta?: string;
}

export interface ProductData {
  title: string;
  description: string;
  price?: string;
  images: string[];
  brand?: string;
  category?: string;
  rating?: string;
  source: string;
}

export interface CreativeBrief {
  videoPrompt: string;
  hook: string;
  body: string;
  cta: string;
  style: string;
  tone: string;
  targetAudience: string;
  duration: number;
  selectedModel: KieModel;
}

export interface PlatformDeliverable {
  platform: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration: number;
  videoUrl?: string;
  caption: string;
  hashtags: string[];
}

export interface ContentPipelineResult {
  pipelineId: string;
  status: 'crawling' | 'briefing' | 'generating' | 'formatting' | 'completed' | 'failed';
  productData?: ProductData;
  creativeBrief?: CreativeBrief;
  taskId?: string;
  videoUrl?: string;
  deliverables: PlatformDeliverable[];
  error?: string;
  startedAt: string;
  completedAt?: string;
  estimatedTime?: number;
}

// ---------------------------------------------------------------------------
// Pipeline Store (in-memory — production would use DB)
// ---------------------------------------------------------------------------

const pipelines = new Map<string, ContentPipelineResult>();

// ---------------------------------------------------------------------------
// Content Pipeline Engine
// ---------------------------------------------------------------------------

export class ContentPipeline {

  // ── Launch Pipeline ───────────────────────────────────────────

  async launch(request: ContentPipelineRequest): Promise<ContentPipelineResult> {
    const pipelineId = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result: ContentPipelineResult = {
      pipelineId,
      status: 'crawling',
      deliverables: [],
      startedAt: new Date().toISOString(),
    };

    pipelines.set(pipelineId, result);

    logger.info({ pipelineId, source: request.source, sourceType: request.sourceType }, '[ContentPipeline] Launching');

    // Run async — don't block the response
    this.runPipeline(pipelineId, request).catch(err => {
      logger.error({ err, pipelineId }, '[ContentPipeline] Pipeline failed');
      const r = pipelines.get(pipelineId);
      if (r) {
        r.status = 'failed';
        r.error = err instanceof Error ? err.message : 'Pipeline error';
      }
    });

    return result;
  }

  // ── Get Pipeline Status ───────────────────────────────────────

  getStatus(pipelineId: string): ContentPipelineResult | null {
    return pipelines.get(pipelineId) || null;
  }

  // ── List User Pipelines ───────────────────────────────────────

  listByUser(userId: string): ContentPipelineResult[] {
    // In production, filter by userId from DB
    return Array.from(pipelines.values());
  }

  // ── Internal Pipeline Execution ───────────────────────────────

  private async runPipeline(pipelineId: string, request: ContentPipelineRequest): Promise<void> {
    const result = pipelines.get(pipelineId)!;

    // Step 1: Extract product data
    result.status = 'crawling';
    const productData = await this.extractProductData(request);
    result.productData = productData;

    // Step 2: Generate creative brief
    result.status = 'briefing';
    const brief = this.generateBrief(productData, request);
    result.creativeBrief = brief;

    // Step 3: Submit video generation
    result.status = 'generating';
    const videoRequest: KieVideoRequest = {
      model: brief.selectedModel,
      prompt: brief.videoPrompt,
      duration: brief.duration,
      aspectRatio: this.getPrimaryAspectRatio(request.platforms),
      audioGeneration: request.withAudio,
    };

    if (productData.images.length > 0) {
      videoRequest.referenceImageUrl = productData.images[0];
    }

    const videoResponse = await kieVideo.generateVideo(videoRequest);
    result.taskId = videoResponse.taskId;
    result.estimatedTime = videoResponse.estimatedTime;

    if (videoResponse.status === 'failed') {
      result.status = 'failed';
      result.error = videoResponse.error;
      return;
    }

    // Step 4: Poll for completion (with timeout)
    const maxWaitMs = 5 * 60 * 1000; // 5 minutes
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await sleep(pollIntervalMs);

      const status = await kieVideo.getTaskStatus(videoResponse.taskId);

      if (status.status === 'completed') {
        result.videoUrl = status.videoUrl;
        break;
      }

      if (status.status === 'failed') {
        result.status = 'failed';
        result.error = status.error || 'Video generation failed';
        return;
      }
    }

    if (!result.videoUrl) {
      // Timeout — mark as still generating, user can poll later
      result.status = 'generating';
      return;
    }

    // Step 5: Format for platforms
    result.status = 'formatting';
    result.deliverables = this.formatForPlatforms(request, productData, brief, result.videoUrl);

    // Done
    result.status = 'completed';
    result.completedAt = new Date().toISOString();

    logger.info(
      { pipelineId, deliverableCount: result.deliverables.length },
      '[ContentPipeline] Pipeline completed'
    );
  }

  // ── Product Data Extraction ───────────────────────────────────

  private async extractProductData(request: ContentPipelineRequest): Promise<ProductData> {
    if (request.sourceType === 'prompt') {
      return {
        title: 'Custom Content',
        description: request.source,
        images: [],
        source: 'user-prompt',
      };
    }

    if (request.sourceType === 'description') {
      return {
        title: request.source.split('.')[0] || 'Product',
        description: request.source,
        images: [],
        source: 'user-description',
      };
    }

    // Product URL crawling
    try {
      const res = await fetch(request.source, {
        headers: {
          'User-Agent': 'AIMS-ContentPipeline/1.0 (Product Data Extraction)',
        },
      });

      if (!res.ok) {
        return {
          title: 'Product',
          description: `Product from ${new URL(request.source).hostname}`,
          images: [],
          source: request.source,
        };
      }

      const html = await res.text();
      return this.parseProductHtml(html, request.source);
    } catch (err) {
      logger.warn({ err, url: request.source }, '[ContentPipeline] Product crawl failed, using URL as description');
      return {
        title: 'Product',
        description: `Product from ${request.source}`,
        images: [],
        source: request.source,
      };
    }
  }

  private parseProductHtml(html: string, url: string): ProductData {
    // Extract Open Graph and standard meta tags
    const getMetaContent = (name: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, 'i'),
        new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m) return m[1];
      }
      return '';
    };

    const title = getMetaContent('title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'Product';

    const description = getMetaContent('description') ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

    // Extract images
    const images: string[] = [];
    const ogImage = getMetaContent('image');
    if (ogImage) images.push(ogImage);

    // Extract price (common patterns)
    const priceMatch = html.match(/\$[\d,]+\.?\d*/);
    const price = priceMatch ? priceMatch[0] : undefined;

    // Extract brand
    const brand = getMetaContent('site_name') || undefined;

    return {
      title: title.trim(),
      description: description.trim(),
      price,
      images,
      brand,
      source: url,
    };
  }

  // ── Creative Brief Generation ─────────────────────────────────

  private generateBrief(productData: ProductData, request: ContentPipelineRequest): CreativeBrief {
    // Select model
    const selectedModel = request.model === 'auto'
      ? this.autoSelectModel(request)
      : request.model;

    // Build video prompt
    const stylePrompts: Record<string, string> = {
      'ugc-review': `Authentic user-generated content style review of ${productData.title}. Handheld camera feel, natural lighting, genuine reaction. Show the product being unboxed and used in a real home setting.`,
      'product-showcase': `Clean, professional product showcase of ${productData.title}. Studio lighting, smooth camera movements, detail close-ups. White background transitioning to lifestyle setting.`,
      'unboxing': `Exciting unboxing experience of ${productData.title}. First-person POV, building anticipation. Slow reveal, genuine excitement, hands-on exploration of the product.`,
      'testimonial': `Enthusiastic testimonial about ${productData.title}. Direct-to-camera, warm lighting, authentic expression. Genuine endorsement with specific benefits mentioned.`,
      'comparison': `Side-by-side comparison featuring ${productData.title}. Split-screen style, clear visual differences, objective presentation with the product as the clear winner.`,
      'cinematic': `Cinematic brand film featuring ${productData.title}. Dramatic lighting, slow motion details, emotional storytelling. Premium feel with artistic camera angles.`,
      'auto': `Dynamic marketing video for ${productData.title}. ${productData.description}. Modern, engaging, scroll-stopping visual style.`,
    };

    const styleKey = request.style === 'auto' ? 'auto' : request.style;
    let videoPrompt = stylePrompts[styleKey] || stylePrompts['auto'];

    // Add product details
    if (productData.description && videoPrompt.length < 200) {
      videoPrompt += ` ${productData.description.slice(0, 100)}`;
    }

    // Build hook
    const hook = request.hook || this.generateHook(productData, request.style);

    // Build CTA
    const cta = request.cta || this.generateCTA(productData);

    // Build caption body
    const body = `${productData.description.slice(0, 150)}${productData.price ? ` | ${productData.price}` : ''}`;

    const tone = request.tone || this.inferTone(request.style);

    return {
      videoPrompt,
      hook,
      body,
      cta,
      style: request.style,
      tone,
      targetAudience: this.inferAudience(productData, request),
      duration: request.duration,
      selectedModel,
    };
  }

  private autoSelectModel(request: ContentPipelineRequest): KieModel {
    const model = kieVideo.recommendModel({
      needsAudio: request.withAudio,
      duration: request.duration,
    });
    return model.id;
  }

  private generateHook(productData: ProductData, style: string): string {
    const hooks: string[] = [
      `Stop scrolling — ${productData.title} just changed the game`,
      `POV: You finally found ${productData.title}`,
      `Wait for it... ${productData.title}`,
      `The ${productData.title} everyone's talking about`,
      `I can't believe ${productData.title} is ${productData.price || 'this affordable'}`,
    ];
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  private generateCTA(productData: ProductData): string {
    const ctas = [
      'Link in bio',
      'Shop now before it sells out',
      `Get yours today${productData.price ? ` for just ${productData.price}` : ''}`,
      'Comment LINK and I\'ll send it to you',
      'Save this for later',
    ];
    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  private inferTone(style: string): string {
    const tones: Record<string, string> = {
      'ugc-review': 'casual, authentic, relatable',
      'product-showcase': 'professional, clean, aspirational',
      'unboxing': 'excited, genuine, personal',
      'testimonial': 'warm, trustworthy, enthusiastic',
      'comparison': 'objective, informative, confident',
      'cinematic': 'premium, artistic, emotional',
      'auto': 'engaging, modern, conversational',
    };
    return tones[style] || tones['auto'];
  }

  private inferAudience(productData: ProductData, request: ContentPipelineRequest): string {
    if (request.platforms.includes('tiktok') || request.platforms.includes('instagram-reels')) {
      return '18-34, social-first shoppers, trend-aware';
    }
    if (request.platforms.includes('meta-ads')) {
      return '25-54, online shoppers, deal seekers';
    }
    return '18-45, general consumers';
  }

  // ── Platform Formatting ───────────────────────────────────────

  private formatForPlatforms(
    request: ContentPipelineRequest,
    product: ProductData,
    brief: CreativeBrief,
    videoUrl: string,
  ): PlatformDeliverable[] {
    const deliverables: PlatformDeliverable[] = [];

    const platformSpecs: Record<string, { aspectRatio: '16:9' | '9:16' | '1:1'; maxDuration: number; hashtagStyle: string }> = {
      'tiktok': { aspectRatio: '9:16', maxDuration: 60, hashtagStyle: 'trending' },
      'instagram-reels': { aspectRatio: '9:16', maxDuration: 90, hashtagStyle: 'mixed' },
      'youtube-shorts': { aspectRatio: '9:16', maxDuration: 60, hashtagStyle: 'descriptive' },
      'meta-ads': { aspectRatio: '1:1', maxDuration: 30, hashtagStyle: 'none' },
      'twitter': { aspectRatio: '16:9', maxDuration: 140, hashtagStyle: 'minimal' },
      'generic': { aspectRatio: '16:9', maxDuration: 120, hashtagStyle: 'mixed' },
    };

    for (const platform of request.platforms) {
      const spec = platformSpecs[platform] || platformSpecs['generic'];
      const hashtags = this.generateHashtags(product, platform, spec.hashtagStyle);

      deliverables.push({
        platform,
        aspectRatio: spec.aspectRatio,
        duration: Math.min(request.duration, spec.maxDuration),
        videoUrl,
        caption: `${brief.hook}\n\n${brief.body}\n\n${brief.cta}${hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : ''}`,
        hashtags,
      });
    }

    return deliverables;
  }

  private generateHashtags(product: ProductData, platform: string, style: string): string[] {
    if (style === 'none') return [];

    const base = ['fyp', 'viral'];
    const productTags = product.title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3)
      .map(w => w.replace(/[^a-z0-9]/g, ''));

    if (style === 'minimal') return productTags.slice(0, 2);
    if (style === 'trending') return [...base, ...productTags, 'tiktokmademebuyit', 'review'];
    return [...productTags, 'review', 'musthave'];
  }

  private getPrimaryAspectRatio(platforms: string[]): '16:9' | '9:16' | '1:1' {
    if (platforms.includes('tiktok') || platforms.includes('instagram-reels') || platforms.includes('youtube-shorts')) {
      return '9:16';
    }
    if (platforms.includes('meta-ads')) return '1:1';
    return '16:9';
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const contentPipeline = new ContentPipeline();
