/**
 * DIY Consultation Flow Configuration
 * Defines the multi-step consultation process before Voice + Vision activation
 */

import type { ConsultationQuestion, ConsultationStep, DIYCategory, SkillLevel } from './types';

// ─────────────────────────────────────────────────────────────
// Consultation Questions
// ─────────────────────────────────────────────────────────────

export const CONSULTATION_QUESTIONS: ConsultationQuestion[] = [
  {
    step: 'welcome',
    prompt: "Welcome to DIY Mode! I'm ACHEEVY, your hands-on project assistant. I'll help guide you through your project with voice and vision. First, let's understand what you're working on. Ready to begin?",
    type: 'confirm',
    options: ['Yes, let\'s start', 'Tell me more first'],
  },
  {
    step: 'project_description',
    prompt: "What project are you working on today? Describe what you're trying to build, fix, or create.",
    type: 'text',
    validation: (value) => value.length >= 10,
  },
  {
    step: 'category_selection',
    prompt: 'Which category best fits your project?',
    type: 'select',
    options: [
      'Home Repair',
      'Woodworking',
      'Plumbing',
      'Electrical',
      'Painting',
      'Gardening',
      'Crafts',
      'Automotive',
      'Electronics',
      'Sewing',
      'Other',
    ],
  },
  {
    step: 'skill_assessment',
    prompt: "What's your experience level with this type of project?",
    type: 'select',
    options: [
      'Beginner - First time doing this',
      'Intermediate - Done similar projects before',
      'Advanced - Very experienced',
    ],
  },
  {
    step: 'tools_inventory',
    prompt: 'What tools do you currently have available? Select all that apply.',
    type: 'multiselect',
    options: [
      'Basic hand tools (hammer, screwdrivers, pliers)',
      'Measuring tools (tape measure, level, square)',
      'Power drill / Driver',
      'Circular saw / Jigsaw',
      'Sander',
      'Safety equipment (goggles, gloves, mask)',
      'Ladder / Step stool',
      'Workbench / Sawhorse',
      'Specialty tools for my project',
      'None / Not sure what I need',
    ],
  },
  {
    step: 'safety_briefing',
    prompt: "Safety first! Based on your project, here are important safety reminders. Please confirm you understand:\n\n• Wear appropriate protective equipment\n• Work in a well-ventilated area\n• Keep your workspace clear and organized\n• Know where your circuit breaker / water shutoff is\n• Have a first aid kit nearby",
    type: 'confirm',
    options: ['I understand and will follow safety guidelines', 'I need more safety information'],
  },
  {
    step: 'plan_review',
    prompt: "Great! I've put together a project plan based on your input. Review it below and let me know if you'd like to make any changes before we begin the hands-on session.",
    type: 'confirm',
    options: ['Looks good, let\'s start!', 'I want to change something'],
  },
];

// ─────────────────────────────────────────────────────────────
// Category Mapping
// ─────────────────────────────────────────────────────────────

export const CATEGORY_MAP: Record<string, DIYCategory> = {
  'Home Repair': 'home_repair',
  'Woodworking': 'woodworking',
  'Plumbing': 'plumbing',
  'Electrical': 'electrical',
  'Painting': 'painting',
  'Gardening': 'gardening',
  'Crafts': 'crafts',
  'Automotive': 'automotive',
  'Electronics': 'electronics',
  'Sewing': 'sewing',
  'Other': 'other',
};

export const SKILL_MAP: Record<string, SkillLevel> = {
  'Beginner - First time doing this': 'beginner',
  'Intermediate - Done similar projects before': 'intermediate',
  'Advanced - Very experienced': 'advanced',
};

// ─────────────────────────────────────────────────────────────
// Step Navigation
// ─────────────────────────────────────────────────────────────

export const STEP_ORDER: ConsultationStep[] = [
  'welcome',
  'project_description',
  'category_selection',
  'skill_assessment',
  'tools_inventory',
  'safety_briefing',
  'plan_review',
  'ready',
];

export function getNextStep(current: ConsultationStep): ConsultationStep {
  const currentIndex = STEP_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return 'ready';
  }
  return STEP_ORDER[currentIndex + 1];
}

export function getPreviousStep(current: ConsultationStep): ConsultationStep | null {
  const currentIndex = STEP_ORDER.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1];
}

export function getStepProgress(current: ConsultationStep): number {
  const currentIndex = STEP_ORDER.indexOf(current);
  return Math.round((currentIndex / (STEP_ORDER.length - 1)) * 100);
}

// ─────────────────────────────────────────────────────────────
// Category-Specific Safety Tips
// ─────────────────────────────────────────────────────────────

export const CATEGORY_SAFETY_TIPS: Record<DIYCategory, string[]> = {
  home_repair: [
    'Turn off power at the breaker before electrical work',
    'Use a stud finder before drilling into walls',
    'Wear safety glasses when using power tools',
  ],
  woodworking: [
    'Always cut away from your body',
    'Secure workpieces before cutting',
    'Use dust collection or wear a respirator',
    'Never reach over a running blade',
  ],
  plumbing: [
    'Turn off water supply before starting',
    'Have towels ready for residual water',
    'Know your main shutoff valve location',
    'Check for asbestos in old pipe insulation',
  ],
  electrical: [
    'ALWAYS turn off power at the breaker',
    'Use a voltage tester to confirm power is off',
    'Never work on live circuits',
    'Follow local electrical codes',
    'Consider hiring a licensed electrician for complex work',
  ],
  painting: [
    'Ensure good ventilation',
    'Use a respirator with oil-based paints',
    'Cover floors and furniture',
    'Check for lead paint in older homes',
  ],
  gardening: [
    'Wear gloves to protect from thorns and irritants',
    'Stay hydrated when working outdoors',
    'Use sunscreen and wear a hat',
    'Be aware of poisonous plants in your area',
  ],
  crafts: [
    'Work in a well-lit area',
    'Use sharp tools carefully',
    'Keep adhesives away from skin and eyes',
    'Ensure good ventilation with glues and paints',
  ],
  automotive: [
    'Never work under a car supported only by a jack',
    'Disconnect the battery for electrical work',
    'Wear safety glasses',
    'Work in a ventilated area',
    'Have a fire extinguisher nearby',
  ],
  electronics: [
    'Unplug devices before working on them',
    'Use an anti-static wrist strap',
    'Never touch capacitors directly',
    'Work on a non-conductive surface',
  ],
  sewing: [
    'Keep fingers away from the needle',
    'Unplug the machine when threading',
    'Use proper lighting to reduce eye strain',
    'Store pins and needles safely',
  ],
  other: [
    'Assess potential hazards before starting',
    'Wear appropriate protective equipment',
    'Keep your workspace organized',
    'Don\'t rush - take breaks when needed',
  ],
};

// ─────────────────────────────────────────────────────────────
// Estimated Duration by Category
// ─────────────────────────────────────────────────────────────

export function estimateDuration(category: DIYCategory, skillLevel: SkillLevel, description: string): string {
  // Base estimates (could be enhanced with AI analysis)
  const baseEstimates: Record<DIYCategory, number> = {
    home_repair: 2,
    woodworking: 4,
    plumbing: 2,
    electrical: 3,
    painting: 3,
    gardening: 2,
    crafts: 2,
    automotive: 3,
    electronics: 2,
    sewing: 2,
    other: 2,
  };

  const skillMultiplier: Record<SkillLevel, number> = {
    beginner: 1.5,
    intermediate: 1.0,
    advanced: 0.75,
  };

  const hours = baseEstimates[category] * skillMultiplier[skillLevel];

  if (hours < 1) return 'Less than 1 hour';
  if (hours === 1) return 'About 1 hour';
  if (hours < 4) return `${Math.round(hours)} hours`;
  if (hours < 8) return 'Half day';
  return 'Full day or more';
}
