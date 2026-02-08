/**
 * PMO Offices — Project Management Governance Layer
 *
 * Eight PMO offices govern all work across A.I.M.S.:
 *   6 Department Board offices (C-Suite governed)
 *   1 HR PMO (People, Standards, and Progression)
 *   1 DT-PMO (Digital Transformation — agentic operations parent)
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
  | 'publishing-office' // Boomer_CPO → Social Agent
  | 'hr-office'         // Betty-Ann_Ang → HR PMO (People, Standards, Progression)
  | 'dtpmo-office';     // Astra_Ang → DT-PMO (Digital Transformation)

export type DirectorId =
  | 'Boomer_CTO'   // Chief Technology Officer
  | 'Boomer_CFO'   // Chief Financial Officer
  | 'Boomer_COO'   // Chief Operating Officer
  | 'Boomer_CMO'   // Chief Marketing Officer
  | 'Boomer_CDO'   // Chief Design Officer
  | 'Boomer_CPO'   // Chief Publication Officer
  | 'Betty-Ann_Ang' // HR PMO Lead
  | 'Astra_Ang';    // DT-PMO Lead

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
