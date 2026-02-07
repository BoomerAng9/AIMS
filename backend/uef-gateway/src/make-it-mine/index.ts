/**
 * Make-It-Mine Engine — Clone & Customize for A.I.M.S.
 *
 * Allows users to take an existing PlugTemplate and customise it for
 * their specific industry and use-case. The engine applies terminology
 * replacements, feature overrides, branding, and industry-specific
 * presets to produce a tailored ProjectSpec.
 *
 * Marketer_Ang and Analyst_Ang feed industry intelligence into the
 * suggestion pipeline. Quality_Ang validates the output via ORACLE gates.
 *
 * — by: ACHIEVEMOR
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { templateLibrary } from '../templates';
import { ProjectSpec } from '../db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloneRequest {
  templateId: string;
  projectName: string;
  industry: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
    logo?: string;
    domain?: string;
  };
  featureOverrides: {
    add: string[];
    remove: string[];
  };
  terminologyMap: Record<string, string>;
}

export interface CloneResult {
  projectId: string;
  projectName: string;
  baseTemplate: string;
  customizations: string[];
  spec: ProjectSpec;
  status: 'ready' | 'needs-review';
}

export interface IndustryPreset {
  features: string[];
  terminology: Record<string, string>;
  suggestedPages: string[];
  suggestedModels: string[];
}

export interface CustomizationSuggestion {
  features: string[];
  terminology: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Industry Presets
// ---------------------------------------------------------------------------

const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  construction: {
    features: [
      'project-tracking',
      'bid-management',
      'safety-compliance',
      'subcontractor-portal',
      'progress-photos',
      'document-management',
      'time-tracking',
      'equipment-tracking',
    ],
    terminology: {
      Product: 'Project',
      Customer: 'Client',
      Order: 'Work Order',
      Invoice: 'Pay Application',
      Category: 'Trade',
      Listing: 'Bid',
      Review: 'Inspection',
      Cart: 'Estimate',
      Inventory: 'Materials',
      Deal: 'Bid',
      Contact: 'Subcontractor',
      Pipeline: 'Project Pipeline',
      Report: 'Progress Report',
    },
    suggestedPages: ['project-tracker', 'bid-board', 'safety-log', 'daily-report'],
    suggestedModels: ['Project', 'Bid', 'SafetyLog', 'DailyReport', 'Subcontractor'],
  },

  healthcare: {
    features: [
      'patient-portal',
      'appointment-scheduling',
      'electronic-health-records',
      'hipaa-compliance',
      'telehealth',
      'prescription-management',
      'billing-insurance',
      'lab-results',
    ],
    terminology: {
      Product: 'Service',
      Customer: 'Patient',
      Order: 'Appointment',
      Invoice: 'Claim',
      Category: 'Specialty',
      Listing: 'Provider',
      Review: 'Patient Feedback',
      Cart: 'Appointment Queue',
      Inventory: 'Medical Supplies',
      Deal: 'Treatment Plan',
      Contact: 'Patient',
      Pipeline: 'Care Pathway',
      Report: 'Clinical Report',
    },
    suggestedPages: ['patient-portal', 'appointments', 'health-records', 'telehealth'],
    suggestedModels: ['Patient', 'Appointment', 'HealthRecord', 'Prescription', 'Claim'],
  },

  'real-estate': {
    features: [
      'property-listings',
      'virtual-tours',
      'mortgage-calculator',
      'agent-profiles',
      'saved-searches',
      'neighborhood-data',
      'document-signing',
      'lead-capture',
    ],
    terminology: {
      Product: 'Property',
      Customer: 'Client',
      Order: 'Transaction',
      Invoice: 'Closing Statement',
      Category: 'Property Type',
      Listing: 'Property Listing',
      Review: 'Agent Review',
      Cart: 'Saved Properties',
      Inventory: 'Active Listings',
      Deal: 'Transaction',
      Contact: 'Lead',
      Pipeline: 'Sales Pipeline',
      Report: 'Market Report',
    },
    suggestedPages: ['listings', 'property-detail', 'agent-profile', 'mortgage-calc'],
    suggestedModels: ['Property', 'Agent', 'Transaction', 'Lead', 'Showing'],
  },

  legal: {
    features: [
      'case-management',
      'document-management',
      'time-billing',
      'client-portal',
      'calendar-scheduling',
      'conflict-checks',
      'trust-accounting',
      'e-signature',
    ],
    terminology: {
      Product: 'Service',
      Customer: 'Client',
      Order: 'Engagement',
      Invoice: 'Invoice',
      Category: 'Practice Area',
      Listing: 'Attorney Profile',
      Review: 'Client Testimonial',
      Cart: 'Retainer',
      Inventory: 'Case Files',
      Deal: 'Case',
      Contact: 'Client',
      Pipeline: 'Case Pipeline',
      Report: 'Case Report',
    },
    suggestedPages: ['case-dashboard', 'documents', 'time-entries', 'client-portal'],
    suggestedModels: ['Case', 'Client', 'TimeEntry', 'Document', 'TrustAccount'],
  },

  education: {
    features: [
      'course-management',
      'student-portal',
      'assignment-submission',
      'grading-system',
      'attendance-tracking',
      'video-lessons',
      'discussion-forums',
      'certificates',
    ],
    terminology: {
      Product: 'Course',
      Customer: 'Student',
      Order: 'Enrollment',
      Invoice: 'Tuition',
      Category: 'Subject',
      Listing: 'Course Listing',
      Review: 'Course Review',
      Cart: 'Course Cart',
      Inventory: 'Course Catalog',
      Deal: 'Enrollment',
      Contact: 'Student',
      Pipeline: 'Enrollment Pipeline',
      Report: 'Academic Report',
    },
    suggestedPages: ['courses', 'course-detail', 'student-dashboard', 'gradebook'],
    suggestedModels: ['Course', 'Student', 'Assignment', 'Grade', 'Enrollment'],
  },

  fitness: {
    features: [
      'class-scheduling',
      'membership-management',
      'workout-tracking',
      'nutrition-plans',
      'trainer-profiles',
      'progress-photos',
      'wearable-integration',
      'leaderboard',
    ],
    terminology: {
      Product: 'Program',
      Customer: 'Member',
      Order: 'Booking',
      Invoice: 'Membership Invoice',
      Category: 'Class Type',
      Listing: 'Class',
      Review: 'Trainer Review',
      Cart: 'Class Cart',
      Inventory: 'Equipment',
      Deal: 'Membership',
      Contact: 'Member',
      Pipeline: 'Lead Pipeline',
      Report: 'Progress Report',
    },
    suggestedPages: ['schedule', 'class-detail', 'member-dashboard', 'progress'],
    suggestedModels: ['Member', 'Class', 'Booking', 'WorkoutLog', 'Membership'],
  },
};

// ---------------------------------------------------------------------------
// Make-It-Mine Engine
// ---------------------------------------------------------------------------

export class MakeItMineEngine {
  constructor() {
    logger.info(
      { industries: Object.keys(INDUSTRY_PRESETS).length },
      '[MakeItMine] Engine initialized'
    );
  }

  // -----------------------------------------------------------------------
  // Public: clone
  // -----------------------------------------------------------------------

  /**
   * Clone a template and apply industry-specific customizations.
   *
   * 1. Retrieves the base template from the library.
   * 2. Applies feature overrides (add / remove).
   * 3. Applies terminology replacements to pages, models, and routes.
   * 4. Merges industry-preset pages and models when relevant.
   * 5. Wraps everything into a ProjectSpec and returns a CloneResult.
   */
  clone(request: CloneRequest): CloneResult {
    logger.info(
      {
        templateId: request.templateId,
        projectName: request.projectName,
        industry: request.industry,
      },
      '[MakeItMine] Clone requested'
    );

    // --- 1. Retrieve base template ---
    const template = templateLibrary.get(request.templateId);
    if (!template) {
      logger.error(
        { templateId: request.templateId },
        '[MakeItMine] Template not found'
      );
      throw new Error(`Template "${request.templateId}" not found in library.`);
    }

    const customizations: string[] = [];

    // --- 2. Feature overrides ---
    let features = [...template.features];

    if (request.featureOverrides.remove.length > 0) {
      const removeLower = request.featureOverrides.remove.map(f => f.toLowerCase());
      const before = features.length;
      features = features.filter(f => !removeLower.includes(f.toLowerCase()));
      const removed = before - features.length;
      if (removed > 0) {
        customizations.push(`Removed ${removed} feature(s): ${request.featureOverrides.remove.join(', ')}`);
      }
    }

    if (request.featureOverrides.add.length > 0) {
      const existingLower = features.map(f => f.toLowerCase());
      const newFeatures = request.featureOverrides.add.filter(
        f => !existingLower.includes(f.toLowerCase())
      );
      features.push(...newFeatures);
      if (newFeatures.length > 0) {
        customizations.push(`Added ${newFeatures.length} feature(s): ${newFeatures.join(', ')}`);
      }
    }

    // --- 3. Merge industry preset ---
    const preset = this.getPreset(request.industry);
    if (preset) {
      const presetFeaturesLower = features.map(f => f.toLowerCase());
      const additionalFeatures = preset.features.filter(
        f => !presetFeaturesLower.includes(f.toLowerCase())
      );
      if (additionalFeatures.length > 0) {
        features.push(...additionalFeatures);
        customizations.push(
          `Applied ${request.industry} industry preset (+${additionalFeatures.length} features)`
        );
      }
    }

    // --- 4. Apply terminology to pages ---
    let pages = [...template.pages];
    const terminologyMap = { ...request.terminologyMap };

    if (preset) {
      // Add preset pages that do not already exist
      const existingPages = new Set(pages.map(p => p.toLowerCase()));
      const additionalPages = preset.suggestedPages.filter(
        p => !existingPages.has(p.toLowerCase())
      );
      if (additionalPages.length > 0) {
        pages.push(...additionalPages);
        customizations.push(`Added ${additionalPages.length} industry-specific page(s)`);
      }
    }

    pages = this.applyTerminologyToList(pages, terminologyMap);

    // --- 5. Apply terminology to models ---
    let dbModels = [...template.dbModels];

    if (preset) {
      const existingModels = new Set(dbModels.map(m => m.toLowerCase()));
      const additionalModels = preset.suggestedModels.filter(
        m => !existingModels.has(m.toLowerCase())
      );
      if (additionalModels.length > 0) {
        dbModels.push(...additionalModels);
        customizations.push(`Added ${additionalModels.length} industry-specific model(s)`);
      }
    }

    dbModels = this.applyTerminologyToList(dbModels, terminologyMap);

    // --- 6. Apply terminology to API routes ---
    let apiRoutes = [...template.apiRoutes];
    apiRoutes = this.applyTerminologyToRoutes(apiRoutes, terminologyMap);

    // --- 7. Branding ---
    customizations.push(
      `Applied branding — primary: ${request.branding.primaryColor}, company: ${request.branding.companyName}`
    );
    if (request.branding.domain) {
      customizations.push(`Domain: ${request.branding.domain}`);
    }
    if (request.branding.logo) {
      customizations.push('Custom logo attached');
    }

    // --- 8. Terminology summary ---
    const termEntries = Object.entries(terminologyMap);
    if (termEntries.length > 0) {
      customizations.push(
        `Terminology replacements (${termEntries.length}): ${termEntries.map(([k, v]) => `${k} -> ${v}`).join(', ')}`
      );
    }

    // --- 9. Estimate file count (base + added pages/models) ---
    const estimatedFiles =
      template.estimatedFiles +
      (pages.length - template.pages.length) * 2 +
      (dbModels.length - template.dbModels.length);

    // --- 10. Build ProjectSpec ---
    const spec: ProjectSpec = {
      archetype: template.archetype,
      techStack: { ...template.techStack },
      pages,
      apiRoutes,
      dbModels,
      integrations: [...template.suggestedIntegrations],
      estimatedFiles: Math.max(estimatedFiles, template.estimatedFiles),
      estimatedBuildTime: template.estimatedBuildTime,
    };

    // --- 11. Determine status ---
    const needsReview =
      features.length > template.features.length + 5 ||
      termEntries.length > 8 ||
      pages.length > template.pages.length + 4;

    const result: CloneResult = {
      projectId: uuidv4(),
      projectName: request.projectName,
      baseTemplate: template.id,
      customizations,
      spec,
      status: needsReview ? 'needs-review' : 'ready',
    };

    logger.info(
      {
        projectId: result.projectId,
        customizations: customizations.length,
        status: result.status,
      },
      '[MakeItMine] Clone complete'
    );

    return result;
  }

  // -----------------------------------------------------------------------
  // Public: suggestCustomizations
  // -----------------------------------------------------------------------

  /**
   * Suggest industry-specific customizations for a given template.
   *
   * Looks up the industry preset and cross-references it with the
   * template's existing features to recommend additions and
   * terminology swaps.
   */
  suggestCustomizations(
    templateId: string,
    industry: string
  ): CustomizationSuggestion {
    logger.info(
      { templateId, industry },
      '[MakeItMine] Generating customization suggestions'
    );

    const template = templateLibrary.get(templateId);
    if (!template) {
      logger.warn({ templateId }, '[MakeItMine] Template not found for suggestions');
      return { features: [], terminology: {} };
    }

    const preset = this.getPreset(industry);
    if (!preset) {
      logger.warn({ industry }, '[MakeItMine] No industry preset found');
      return { features: [], terminology: {} };
    }

    // Features the template does not already have
    const existingLower = new Set(template.features.map(f => f.toLowerCase()));
    const suggestedFeatures = preset.features.filter(
      f => !existingLower.has(f.toLowerCase())
    );

    // Terminology that applies to this template's models
    const relevantTerminology: Record<string, string> = {};
    const templateTokens = new Set([
      ...template.dbModels,
      ...template.pages.map(p => this.toTitleCase(p)),
    ]);

    for (const [original, replacement] of Object.entries(preset.terminology)) {
      if (templateTokens.has(original)) {
        relevantTerminology[original] = replacement;
      }
    }

    const suggestion: CustomizationSuggestion = {
      features: suggestedFeatures,
      terminology: relevantTerminology,
    };

    logger.info(
      {
        suggestedFeatures: suggestedFeatures.length,
        terminologyEntries: Object.keys(relevantTerminology).length,
      },
      '[MakeItMine] Suggestions generated'
    );

    return suggestion;
  }

  // -----------------------------------------------------------------------
  // Public: listIndustries
  // -----------------------------------------------------------------------

  /** Return the list of supported industry preset keys. */
  listIndustries(): string[] {
    return Object.keys(INDUSTRY_PRESETS);
  }

  // -----------------------------------------------------------------------
  // Public: getPreset
  // -----------------------------------------------------------------------

  /** Retrieve an industry preset (or undefined if unknown). */
  getPreset(industry: string): IndustryPreset | undefined {
    return INDUSTRY_PRESETS[industry.toLowerCase()];
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Apply terminology replacements to an array of strings.
   * Matches are case-insensitive but preserve the replacement's casing.
   */
  private applyTerminologyToList(
    items: string[],
    terminology: Record<string, string>
  ): string[] {
    if (Object.keys(terminology).length === 0) return items;

    return items.map(item => {
      let result = item;
      for (const [original, replacement] of Object.entries(terminology)) {
        const regex = new RegExp(this.escapeRegex(original), 'gi');
        result = result.replace(regex, replacement);
      }
      return result;
    });
  }

  /**
   * Apply terminology replacements to API route paths.
   * Converts replacement terms to lowercase-kebab-case for URL friendliness.
   */
  private applyTerminologyToRoutes(
    routes: string[],
    terminology: Record<string, string>
  ): string[] {
    if (Object.keys(terminology).length === 0) return routes;

    return routes.map(route => {
      let result = route;
      for (const [original, replacement] of Object.entries(terminology)) {
        const kebabReplacement = this.toKebabCase(replacement);
        const regex = new RegExp(this.escapeRegex(original.toLowerCase()), 'gi');
        result = result.replace(regex, kebabReplacement);
      }
      return result;
    });
  }

  private toTitleCase(slug: string): string {
    return slug
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const makeItMine = new MakeItMineEngine();
