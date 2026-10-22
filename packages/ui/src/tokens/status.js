/**
 * Pipeline status colors for charts / StatusStackBar.
 * SoT for product viz — knowledge/zaoly-ui-product-sot.md Wave D
 */
import { zaolyBrand } from './brand';
/** Default Zaoly status map (light + dark + v2). */
export const zaolyStatus = {
    COMPLETED: zaolyBrand.green,
    ENRICHED: '#16a34a',
    CATEGORY_READY: '#22c55e',
    CATEGORY_QUEUED: zaolyBrand.yellow,
    ENRICH_QUEUED: zaolyBrand.orange,
    EMBED_QUEUED: '#ea580c',
    CONTENT_READY: zaolyBrand.blue,
    SKIPPED_NEAR_DUP: '#94a3b8',
    FAILED_ENRICH: '#ef4444',
};
/** Forest theme status map (legacy). */
export const forestStatus = {
    COMPLETED: '#7ec8a3',
    ENRICHED: '#6a9e88',
    CATEGORY_READY: '#8fb39a',
    CATEGORY_QUEUED: '#9aab7a',
    ENRICH_QUEUED: '#c4a35a',
    EMBED_QUEUED: '#a89060',
    CONTENT_READY: '#7eb8c4',
    SKIPPED_NEAR_DUP: '#5a6560',
    FAILED_ENRICH: '#c47a7a',
};
