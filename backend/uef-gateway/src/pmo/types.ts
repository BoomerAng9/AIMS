/**
 * PMO Offices — Project Management Governance Layer
 *
 * Six PMO offices govern all work across A.I.M.S.
 * Directors are supervisory Boomer_Angs — they govern, NOT execute.
 * Teams are execution-level Boomer_Angs assigned to each office.
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

export type PmoId =
  | 'dt-pmo'      // Digital Transformation
  | 'strat-pmo'   // Strategy
  | 'ops-pmo'     // Operations
  | 'innov-pmo'   // Innovation
  | 'comply-pmo'  // Compliance
  | 'growth-pmo'; // Growth

export type DirectorId =
  | 'CDTO_Ang'  // Chief Digital Transformation Officer
  | 'CSO_Ang'   // Chief Strategy Officer
  | 'COO_Ang'   // Chief Operating Officer
  | 'CIO_Ang'   // Chief Innovation Officer
  | 'CISO_Ang'  // Chief Information Security Officer
  | 'CGO_Ang';  // Chief Growth Officer

// Additional supervisory roles that exist on teams
export type SupervisoryId = DirectorId
  | 'CTO_Ang'   // Chief Technology Officer (DT team)
  | 'CFO_Ang'   // Chief Financial Officer (DT team)
  | 'QA_Ang';   // Quality Assurance (DT team)

export interface PmoDirector {
  id: DirectorId;
  title: string;
  fullName: string;          // e.g., "CDTO_Ang"
  scope: string;             // what they govern
  authority: string;         // what decisions they can make
  reportsTo: 'ACHEEVY';     // all directors report to ACHEEVY
}

export interface PmoTeamMember {
  id: SupervisoryId | string;  // can be supervisory or execution agent
  title: string;
  role: string;
  department: PmoId;
}

export interface PmoOffice {
  id: PmoId;
  name: string;
  fullName: string;
  mission: string;
  director: PmoDirector;
  team: PmoTeamMember[];
  kpis: string[];          // key performance indicators
  status: 'ACTIVE' | 'STANDBY' | 'PROVISIONING';
}

export interface HouseOfAngConfig {
  totalAngs: number;
  activePmos: number;
  deployedAngs: number;
  standbyAngs: number;
  spawnCapacity: number;   // how many more Angs can be created
}
