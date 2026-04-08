/**
 * Video Module — KIE.ai Unified Video Generation + Content Pipeline
 *
 * All video generation routes through KIE.ai (17+ models, 7 providers).
 * Content Pipeline automates: Product URL → Video → Multi-Platform Ads.
 */

export { KieVideoClient, kieVideo, KIE_MODELS } from './kie-client';
export type { KieModel, KieVideoRequest, KieVideoResponse, KieAccountInfo, ModelInfo } from './kie-client';

export { ContentPipeline, contentPipeline } from './content-pipeline';
export type { ContentPipelineRequest, ContentPipelineResult, ProductData, CreativeBrief, PlatformDeliverable } from './content-pipeline';

export { videoRouter } from './router';
