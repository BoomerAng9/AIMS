/**
 * PMO Offices — Project Management Governance Layer
 *
 * Six C-Suite Boomer_Ang executives govern all work across A.I.M.S.
 * Each has a departmental agent underneath.
 *
 * Command chain:
 *   Human (Final Approver) → ACHEEVY → Boomer_[ROLE] → Departmental Agent → Execution
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

export type PmoId =
  | 'tech-office'       // Boomer_CTO → DevOps Agent
  | 'finance-office'    // Boomer_CFO → Value Agent
  | 'ops-office'        // Boomer_COO → Flow Boss Agent
  | 'marketing-office'  // Boomer_CMO → Social Campaign Agent
  | 'design-office'     // Boomer_CDO → Video Editing Agent
  | 'publishing-office'; // Boomer_CPO → Social Agent

export type DirectorId =
  | 'Boomer_CTO'   // Chief Technology Officer
  | 'Boomer_CFO'   // Chief Financial Officer
  | 'Boomer_COO'   // Chief Operating Officer
  | 'Boomer_CMO'   // Chief Marketing Officer
  | 'Boomer_CDO'   // Chief Design Officer
  | 'Boomer_CPO';  // Chief Publication Officer

export interface PmoDirector {
  id: DirectorId;
  title: string;
  fullName: string;
  scope: string;
  authority: string;
  reportsTo: 'ACHEEVY';
}

export interface DepartmentalAgent {
  id: string;
  name: string;
  role: string;
  reportsTo: DirectorId;
}

export interface PmoOffice {
  id: PmoId;
  name: string;
  fullName: string;
  mission: string;
  director: PmoDirector;
  departmentalAgent: DepartmentalAgent;
  kpis: string[];
  status: 'ACTIVE' | 'STANDBY' | 'PROVISIONING';
}

export interface HouseOfAngConfig {
  totalAngs: number;
  activePmos: number;
  deployedAngs: number;
  standbyAngs: number;
  spawnCapacity: number;
}
