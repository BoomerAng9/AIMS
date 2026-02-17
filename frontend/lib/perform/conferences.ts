/**
 * Per|Form Conference Directory — Complete CFB Data
 *
 * Power 4 + Group of 5 conferences, all teams, coaching staffs,
 * social media handles, and program profiles.
 *
 * DOMAIN: This is Per|Form (sports/NIL) — NOT Book of V.I.B.E. lore.
 *
 * Data current as of: 2025-2026 season
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ConferenceTier = 'power4' | 'group_of_5' | 'independent';

export interface Conference {
  id: string;
  name: string;
  abbreviation: string;
  tier: ConferenceTier;
  commissioner: string;
  hqCity: string;
  hqState: string;
  logo?: string;
  founded: number;
  teams: Team[];
}

export interface CoachingStaff {
  role: string;
  name: string;
  since?: number;
  note?: string;
}

export interface SocialMedia {
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export interface Team {
  id: string;
  schoolName: string;
  commonName: string;
  abbreviation: string;
  mascot: string;
  city: string;
  state: string;
  stadium: string;
  stadiumCapacity: number;
  colors: { name: string; hex: string }[];
  headCoach: string;
  headCoachSince: number;
  coachingStaff: CoachingStaff[];
  social: SocialMedia;
  recruitingSocial?: SocialMedia;
  bio: string;
  founded: number;
  enrollment?: number;
  conference: string;
  division?: string;
  joinedConference?: number;
}

// ─────────────────────────────────────────────────────────────
// Tier Styles
// ─────────────────────────────────────────────────────────────

export const TIER_LABELS: Record<ConferenceTier, { label: string; color: string; bg: string; border: string }> = {
  power4: { label: 'Power 4', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
  group_of_5: { label: 'Group of 5', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  independent: { label: 'Independent', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
};

// ─────────────────────────────────────────────────────────────
// Helper to generate school bio
// ─────────────────────────────────────────────────────────────

function schoolBio(name: string, city: string, state: string, founded: number, conf: string, mascot: string, stadium: string, cap: number): string {
  return `${name} is located in ${city}, ${state}, founded in ${founded}. Competing in the ${conf}, the ${mascot} play home games at ${stadium} (capacity: ${cap.toLocaleString()}).`;
}

// ─────────────────────────────────────────────────────────────
// POWER 4 CONFERENCES
// ─────────────────────────────────────────────────────────────

export const CONFERENCES: Conference[] = [
  // ═══════════════════════════════════════════════════════════
  // ACC
  // ═══════════════════════════════════════════════════════════
  {
    id: 'acc',
    name: 'Atlantic Coast Conference',
    abbreviation: 'ACC',
    tier: 'power4',
    commissioner: 'Jim Phillips',
    hqCity: 'Charlotte',
    hqState: 'NC',
    founded: 1953,
    teams: [
      { id: 'bc', schoolName: 'Boston College', commonName: 'Boston College', abbreviation: 'BC', mascot: 'Eagles', city: 'Chestnut Hill', state: 'MA', stadium: 'Alumni Stadium', stadiumCapacity: 44500, colors: [{ name: 'Maroon', hex: '#8C2633' }, { name: 'Gold', hex: '#B29D6C' }], headCoach: 'Bill O\'Brien', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BCFootball', instagram: '@bcfootball', website: 'https://bceagles.com/sports/football' }, bio: '', founded: 1863, conference: 'ACC' },
      { id: 'cal', schoolName: 'University of California, Berkeley', commonName: 'California', abbreviation: 'CAL', mascot: 'Golden Bears', city: 'Berkeley', state: 'CA', stadium: 'California Memorial Stadium', stadiumCapacity: 63186, colors: [{ name: 'Berkeley Blue', hex: '#003262' }, { name: 'California Gold', hex: '#FDB515' }], headCoach: 'Justin Wilcox', headCoachSince: 2017, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CalFootball', instagram: '@calfootball', website: 'https://calbears.com/sports/football' }, bio: '', founded: 1868, conference: 'ACC', joinedConference: 2024 },
      { id: 'clem', schoolName: 'Clemson University', commonName: 'Clemson', abbreviation: 'CLEM', mascot: 'Tigers', city: 'Clemson', state: 'SC', stadium: 'Memorial Stadium (Death Valley)', stadiumCapacity: 81500, colors: [{ name: 'Clemson Orange', hex: '#F56600' }, { name: 'Regalia Purple', hex: '#522D80' }], headCoach: 'Dabo Swinney', headCoachSince: 2009, coachingStaff: [{ role: 'OC', name: 'Garrett Riley' }, { role: 'DC', name: 'Tom Allen' }], social: { twitter: '@ClemsonFB', instagram: '@clemsonfb', website: 'https://clemsontigers.com/sports/football' }, bio: '', founded: 1889, conference: 'ACC' },
      { id: 'duke', schoolName: 'Duke University', commonName: 'Duke', abbreviation: 'DUKE', mascot: 'Blue Devils', city: 'Durham', state: 'NC', stadium: 'Wallace Wade Stadium', stadiumCapacity: 40004, colors: [{ name: 'Duke Blue', hex: '#003087' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Manny Diaz', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@DukeFOOTBALL', instagram: '@dukefootball', website: 'https://goduke.com/sports/football' }, bio: '', founded: 1838, conference: 'ACC' },
      { id: 'fsu', schoolName: 'Florida State University', commonName: 'Florida State', abbreviation: 'FSU', mascot: 'Seminoles', city: 'Tallahassee', state: 'FL', stadium: 'Doak Campbell Stadium', stadiumCapacity: 79560, colors: [{ name: 'Garnet', hex: '#782F40' }, { name: 'Gold', hex: '#CEB888' }], headCoach: 'Mike Norvell', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@FSUFootball', instagram: '@fsufootball', website: 'https://seminoles.com/sports/football' }, bio: '', founded: 1851, conference: 'ACC' },
      { id: 'gt', schoolName: 'Georgia Institute of Technology', commonName: 'Georgia Tech', abbreviation: 'GT', mascot: 'Yellow Jackets', city: 'Atlanta', state: 'GA', stadium: 'Bobby Dodd Stadium', stadiumCapacity: 55000, colors: [{ name: 'Tech Gold', hex: '#B3A369' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Navy Blue', hex: '#003057' }], headCoach: 'Brent Key', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GeorgiaTechFB', instagram: '@georgiatechfb', website: 'https://ramblinwreck.com/sports/football' }, bio: '', founded: 1885, conference: 'ACC' },
      { id: 'lou', schoolName: 'University of Louisville', commonName: 'Louisville', abbreviation: 'LOU', mascot: 'Cardinals', city: 'Louisville', state: 'KY', stadium: 'L&N Federal Credit Union Stadium', stadiumCapacity: 60800, colors: [{ name: 'Red', hex: '#AD0000' }, { name: 'Black', hex: '#000000' }], headCoach: 'Jeff Brohm', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@LouisvilleFB', instagram: '@louisvillefb', website: 'https://gocards.com/sports/football' }, bio: '', founded: 1798, conference: 'ACC' },
      { id: 'mia', schoolName: 'University of Miami', commonName: 'Miami', abbreviation: 'MIA', mascot: 'Hurricanes', city: 'Coral Gables', state: 'FL', stadium: 'Hard Rock Stadium', stadiumCapacity: 64767, colors: [{ name: 'Orange', hex: '#F47321' }, { name: 'Green', hex: '#005030' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Mario Cristobal', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CanesFootball', instagram: '@cabornesfootball', website: 'https://miamihurricanes.com/sports/football' }, bio: '', founded: 1925, conference: 'ACC' },
      { id: 'unc', schoolName: 'University of North Carolina at Chapel Hill', commonName: 'North Carolina', abbreviation: 'UNC', mascot: 'Tar Heels', city: 'Chapel Hill', state: 'NC', stadium: 'Kenan Memorial Stadium', stadiumCapacity: 50500, colors: [{ name: 'Carolina Blue', hex: '#7BAFD4' }, { name: 'Navy', hex: '#13294B' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Bill Belichick', headCoachSince: 2025, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UNCFootball', instagram: '@uncfootball', website: 'https://goheels.com/sports/football' }, bio: '', founded: 1789, conference: 'ACC' },
      { id: 'ncst', schoolName: 'North Carolina State University', commonName: 'NC State', abbreviation: 'NCST', mascot: 'Wolfpack', city: 'Raleigh', state: 'NC', stadium: 'Carter-Finley Stadium', stadiumCapacity: 57583, colors: [{ name: 'Red', hex: '#CC0000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Dave Doeren', headCoachSince: 2013, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@PackFootball', instagram: '@packfootball', website: 'https://gopack.com/sports/football' }, bio: '', founded: 1887, conference: 'ACC' },
      { id: 'pitt', schoolName: 'University of Pittsburgh', commonName: 'Pittsburgh', abbreviation: 'PITT', mascot: 'Panthers', city: 'Pittsburgh', state: 'PA', stadium: 'Acrisure Stadium', stadiumCapacity: 68400, colors: [{ name: 'Blue', hex: '#003594' }, { name: 'Gold', hex: '#FFB81C' }], headCoach: 'Pat Narduzzi', headCoachSince: 2015, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@Pitt_FB', instagram: '@pabornesfb', website: 'https://pittsburghpanthers.com/sports/football' }, bio: '', founded: 1787, conference: 'ACC' },
      { id: 'smu', schoolName: 'Southern Methodist University', commonName: 'SMU', abbreviation: 'SMU', mascot: 'Mustangs', city: 'Dallas', state: 'TX', stadium: 'Gerald J. Ford Stadium', stadiumCapacity: 32000, colors: [{ name: 'SMU Red', hex: '#CC0035' }, { name: 'SMU Blue', hex: '#354CA1' }], headCoach: 'Rhett Lashlee', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@SMUFB', instagram: '@smufb', website: 'https://smumustangs.com/sports/football' }, bio: '', founded: 1911, conference: 'ACC', joinedConference: 2024 },
      { id: 'stan', schoolName: 'Stanford University', commonName: 'Stanford', abbreviation: 'STAN', mascot: 'Cardinal', city: 'Stanford', state: 'CA', stadium: 'Stanford Stadium', stadiumCapacity: 50424, colors: [{ name: 'Cardinal Red', hex: '#8C1515' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Troy Taylor', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@StanfordFball', instagram: '@stanfordfball', website: 'https://gostanford.com/sports/football' }, bio: '', founded: 1885, conference: 'ACC', joinedConference: 2024 },
      { id: 'syr', schoolName: 'Syracuse University', commonName: 'Syracuse', abbreviation: 'SYR', mascot: 'Orange', city: 'Syracuse', state: 'NY', stadium: 'JMA Wireless Dome', stadiumCapacity: 49262, colors: [{ name: 'Orange', hex: '#D44500' }, { name: 'Blue', hex: '#003DA5' }], headCoach: 'Fran Brown', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CuseFootball', instagram: '@cusefootball', website: 'https://cuse.com/sports/football' }, bio: '', founded: 1870, conference: 'ACC' },
      { id: 'uva', schoolName: 'University of Virginia', commonName: 'Virginia', abbreviation: 'UVA', mascot: 'Cavaliers', city: 'Charlottesville', state: 'VA', stadium: 'Scott Stadium', stadiumCapacity: 61500, colors: [{ name: 'Virginia Orange', hex: '#E57200' }, { name: 'Navy Blue', hex: '#232D4B' }], headCoach: 'Tony Elliott', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UVAFootball', instagram: '@uvafootball', website: 'https://virginiasports.com/sports/football' }, bio: '', founded: 1819, conference: 'ACC' },
      { id: 'vt', schoolName: 'Virginia Polytechnic Institute and State University', commonName: 'Virginia Tech', abbreviation: 'VT', mascot: 'Hokies', city: 'Blacksburg', state: 'VA', stadium: 'Lane Stadium', stadiumCapacity: 65632, colors: [{ name: 'Chicago Maroon', hex: '#660000' }, { name: 'Burnt Orange', hex: '#FF6600' }], headCoach: 'Brent Pry', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@HokiesFB', instagram: '@hokiesfb', website: 'https://hokiesports.com/sports/football' }, bio: '', founded: 1872, conference: 'ACC' },
      { id: 'wake', schoolName: 'Wake Forest University', commonName: 'Wake Forest', abbreviation: 'WAKE', mascot: 'Demon Deacons', city: 'Winston-Salem', state: 'NC', stadium: 'Allegacy Federal Credit Union Stadium', stadiumCapacity: 31500, colors: [{ name: 'Old Gold', hex: '#9E7E38' }, { name: 'Black', hex: '#000000' }], headCoach: 'Dave Clawson', headCoachSince: 2014, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@WakeFB', instagram: '@wakefb', website: 'https://godeacs.com/sports/football' }, bio: '', founded: 1834, conference: 'ACC' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BIG TEN
  // ═══════════════════════════════════════════════════════════
  {
    id: 'big-ten',
    name: 'Big Ten Conference',
    abbreviation: 'B1G',
    tier: 'power4',
    commissioner: 'Tony Petitti',
    hqCity: 'Rosemont',
    hqState: 'IL',
    founded: 1896,
    teams: [
      { id: 'ill', schoolName: 'University of Illinois', commonName: 'Illinois', abbreviation: 'ILL', mascot: 'Fighting Illini', city: 'Champaign', state: 'IL', stadium: 'Memorial Stadium', stadiumCapacity: 60670, colors: [{ name: 'Illini Orange', hex: '#E84A27' }, { name: 'Illini Blue', hex: '#13294B' }], headCoach: 'Bret Bielema', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@IlliniFootball', instagram: '@illinifootball' }, bio: '', founded: 1867, conference: 'Big Ten' },
      { id: 'ind', schoolName: 'Indiana University', commonName: 'Indiana', abbreviation: 'IND', mascot: 'Hoosiers', city: 'Bloomington', state: 'IN', stadium: 'Memorial Stadium', stadiumCapacity: 52929, colors: [{ name: 'Cream', hex: '#EDEBDF' }, { name: 'Crimson', hex: '#990000' }], headCoach: 'Curt Cignetti', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@IndianaFootball', instagram: '@indianafootball' }, bio: '', founded: 1820, conference: 'Big Ten' },
      { id: 'iowa', schoolName: 'University of Iowa', commonName: 'Iowa', abbreviation: 'IOWA', mascot: 'Hawkeyes', city: 'Iowa City', state: 'IA', stadium: 'Kinnick Stadium', stadiumCapacity: 69250, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#FFCD00' }], headCoach: 'Kirk Ferentz', headCoachSince: 1999, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'Phil Parker' }], social: { twitter: '@HawkeyeFootball', instagram: '@hawkeyefootball' }, bio: '', founded: 1847, conference: 'Big Ten' },
      { id: 'md', schoolName: 'University of Maryland', commonName: 'Maryland', abbreviation: 'MD', mascot: 'Terrapins', city: 'College Park', state: 'MD', stadium: 'SECU Stadium', stadiumCapacity: 51802, colors: [{ name: 'Red', hex: '#E21833' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#FFD200' }], headCoach: 'Mike Locksley', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TerpsFootball', instagram: '@terpsfootball' }, bio: '', founded: 1856, conference: 'Big Ten' },
      { id: 'mich', schoolName: 'University of Michigan', commonName: 'Michigan', abbreviation: 'MICH', mascot: 'Wolverines', city: 'Ann Arbor', state: 'MI', stadium: 'Michigan Stadium (The Big House)', stadiumCapacity: 107601, colors: [{ name: 'Maize', hex: '#FFCB05' }, { name: 'Blue', hex: '#00274C' }], headCoach: 'Kyle Whittingham', headCoachSince: 2026, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UMichFootball', instagram: '@umichfootball' }, bio: '', founded: 1817, conference: 'Big Ten' },
      { id: 'msu', schoolName: 'Michigan State University', commonName: 'Michigan State', abbreviation: 'MSU', mascot: 'Spartans', city: 'East Lansing', state: 'MI', stadium: 'Spartan Stadium', stadiumCapacity: 75005, colors: [{ name: 'Green', hex: '#18453B' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Jonathan Smith', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MSU_Football', instagram: '@msufootball' }, bio: '', founded: 1855, conference: 'Big Ten' },
      { id: 'minn', schoolName: 'University of Minnesota', commonName: 'Minnesota', abbreviation: 'MINN', mascot: 'Golden Gophers', city: 'Minneapolis', state: 'MN', stadium: 'Huntington Bank Stadium', stadiumCapacity: 50805, colors: [{ name: 'Maroon', hex: '#7A0019' }, { name: 'Gold', hex: '#FFCC33' }], headCoach: 'P.J. Fleck', headCoachSince: 2017, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GopherFootball', instagram: '@gabornesfootball' }, bio: '', founded: 1851, conference: 'Big Ten' },
      { id: 'neb', schoolName: 'University of Nebraska', commonName: 'Nebraska', abbreviation: 'NEB', mascot: 'Cornhuskers', city: 'Lincoln', state: 'NE', stadium: 'Memorial Stadium', stadiumCapacity: 85458, colors: [{ name: 'Scarlet', hex: '#D00000' }, { name: 'Cream', hex: '#F5F1E7' }], headCoach: 'Matt Rhule', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@HuskerFBNation', instagram: '@habornesfbnation' }, bio: '', founded: 1869, conference: 'Big Ten' },
      { id: 'nw', schoolName: 'Northwestern University', commonName: 'Northwestern', abbreviation: 'NW', mascot: 'Wildcats', city: 'Evanston', state: 'IL', stadium: 'Martin Stadium', stadiumCapacity: 47130, colors: [{ name: 'Purple', hex: '#4E2A84' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'David Braun', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@NUFBFamily', instagram: '@nufbfamily' }, bio: '', founded: 1851, conference: 'Big Ten' },
      { id: 'osu', schoolName: 'The Ohio State University', commonName: 'Ohio State', abbreviation: 'OSU', mascot: 'Buckeyes', city: 'Columbus', state: 'OH', stadium: 'Ohio Stadium (The Horseshoe)', stadiumCapacity: 102780, colors: [{ name: 'Scarlet', hex: '#BB0000' }, { name: 'Gray', hex: '#666666' }], headCoach: 'Ryan Day', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'Chip Kelly' }, { role: 'DC', name: 'Jim Knowles' }], social: { twitter: '@OhioStateFB', instagram: '@ohiostatefb' }, bio: '', founded: 1870, conference: 'Big Ten' },
      { id: 'ore', schoolName: 'University of Oregon', commonName: 'Oregon', abbreviation: 'ORE', mascot: 'Ducks', city: 'Eugene', state: 'OR', stadium: 'Autzen Stadium', stadiumCapacity: 54000, colors: [{ name: 'Oregon Green', hex: '#154733' }, { name: 'Yellow', hex: '#FEE123' }], headCoach: 'Dan Lanning', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'Will Stein' }, { role: 'DC', name: 'Tosh Lupoi' }], social: { twitter: '@oregonfootball', instagram: '@oregonfootball' }, bio: '', founded: 1876, conference: 'Big Ten', joinedConference: 2024 },
      { id: 'psu', schoolName: 'The Pennsylvania State University', commonName: 'Penn State', abbreviation: 'PSU', mascot: 'Nittany Lions', city: 'University Park', state: 'PA', stadium: 'Beaver Stadium', stadiumCapacity: 106572, colors: [{ name: 'Nittany Navy', hex: '#041E42' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Matt Campbell', headCoachSince: 2026, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@PennStateFball', instagram: '@pennstatefball' }, bio: '', founded: 1855, conference: 'Big Ten' },
      { id: 'pur', schoolName: 'Purdue University', commonName: 'Purdue', abbreviation: 'PUR', mascot: 'Boilermakers', city: 'West Lafayette', state: 'IN', stadium: 'Ross-Ade Stadium', stadiumCapacity: 57236, colors: [{ name: 'Old Gold', hex: '#CFB991' }, { name: 'Black', hex: '#000000' }], headCoach: 'Ryan Walters', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BoilerFootball', instagram: '@boilerfootball' }, bio: '', founded: 1869, conference: 'Big Ten' },
      { id: 'rut', schoolName: 'Rutgers University', commonName: 'Rutgers', abbreviation: 'RUT', mascot: 'Scarlet Knights', city: 'Piscataway', state: 'NJ', stadium: 'SHI Stadium', stadiumCapacity: 52454, colors: [{ name: 'Scarlet', hex: '#CC0033' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Greg Schiano', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@RFootball', instagram: '@rfootball' }, bio: '', founded: 1766, conference: 'Big Ten' },
      { id: 'ucla', schoolName: 'University of California, Los Angeles', commonName: 'UCLA', abbreviation: 'UCLA', mascot: 'Bruins', city: 'Los Angeles', state: 'CA', stadium: 'Rose Bowl', stadiumCapacity: 91136, colors: [{ name: 'True Blue', hex: '#2D68C4' }, { name: 'Gold', hex: '#F2A900' }], headCoach: 'DeShaun Foster', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UCLAFootball', instagram: '@uclafootball' }, bio: '', founded: 1919, conference: 'Big Ten', joinedConference: 2024 },
      { id: 'usc', schoolName: 'University of Southern California', commonName: 'USC', abbreviation: 'USC', mascot: 'Trojans', city: 'Los Angeles', state: 'CA', stadium: 'Los Angeles Memorial Coliseum', stadiumCapacity: 77500, colors: [{ name: 'Cardinal', hex: '#990000' }, { name: 'Gold', hex: '#FFCC00' }], headCoach: 'Lincoln Riley', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'D\'Anton Lynn' }], social: { twitter: '@USC_FB', instagram: '@usc.fb' }, bio: '', founded: 1880, conference: 'Big Ten', joinedConference: 2024 },
      { id: 'uw', schoolName: 'University of Washington', commonName: 'Washington', abbreviation: 'UW', mascot: 'Huskies', city: 'Seattle', state: 'WA', stadium: 'Husky Stadium', stadiumCapacity: 70083, colors: [{ name: 'Purple', hex: '#4B2E83' }, { name: 'Gold', hex: '#B7A57A' }], headCoach: 'Jedd Fisch', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UW_Football', instagram: '@uw_football' }, bio: '', founded: 1861, conference: 'Big Ten', joinedConference: 2024 },
      { id: 'wis', schoolName: 'University of Wisconsin', commonName: 'Wisconsin', abbreviation: 'WIS', mascot: 'Badgers', city: 'Madison', state: 'WI', stadium: 'Camp Randall Stadium', stadiumCapacity: 80321, colors: [{ name: 'Cardinal', hex: '#C5050C' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Luke Fickell', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BadgerFootball', instagram: '@badgerfootball' }, bio: '', founded: 1848, conference: 'Big Ten' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BIG 12
  // ═══════════════════════════════════════════════════════════
  {
    id: 'big-12',
    name: 'Big 12 Conference',
    abbreviation: 'Big 12',
    tier: 'power4',
    commissioner: 'Brett Yormark',
    hqCity: 'Irving',
    hqState: 'TX',
    founded: 1996,
    teams: [
      { id: 'ariz', schoolName: 'University of Arizona', commonName: 'Arizona', abbreviation: 'ARIZ', mascot: 'Wildcats', city: 'Tucson', state: 'AZ', stadium: 'Arizona Stadium', stadiumCapacity: 56037, colors: [{ name: 'Cardinal Red', hex: '#CC0033' }, { name: 'Navy Blue', hex: '#003366' }], headCoach: 'Brent Brennan', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ArizonaFBall', instagram: '@arizonafball' }, bio: '', founded: 1885, conference: 'Big 12', joinedConference: 2024 },
      { id: 'asu', schoolName: 'Arizona State University', commonName: 'Arizona State', abbreviation: 'ASU', mascot: 'Sun Devils', city: 'Tempe', state: 'AZ', stadium: 'Mountain America Stadium', stadiumCapacity: 53599, colors: [{ name: 'Maroon', hex: '#8C1D40' }, { name: 'Gold', hex: '#FFC627' }], headCoach: 'Kenny Dillingham', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ASUFootball', instagram: '@asufootball' }, bio: '', founded: 1885, conference: 'Big 12', joinedConference: 2024 },
      { id: 'bay', schoolName: 'Baylor University', commonName: 'Baylor', abbreviation: 'BAY', mascot: 'Bears', city: 'Waco', state: 'TX', stadium: 'McLane Stadium', stadiumCapacity: 45140, colors: [{ name: 'Green', hex: '#154734' }, { name: 'Gold', hex: '#FFB81C' }], headCoach: 'Dave Aranda', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BUFootball', instagram: '@bufootball' }, bio: '', founded: 1845, conference: 'Big 12' },
      { id: 'byu', schoolName: 'Brigham Young University', commonName: 'BYU', abbreviation: 'BYU', mascot: 'Cougars', city: 'Provo', state: 'UT', stadium: 'LaVell Edwards Stadium', stadiumCapacity: 63470, colors: [{ name: 'BYU Blue', hex: '#002E5D' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Kalani Sitake', headCoachSince: 2016, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BYUfootball', instagram: '@byufootball' }, bio: '', founded: 1875, conference: 'Big 12' },
      { id: 'cin', schoolName: 'University of Cincinnati', commonName: 'Cincinnati', abbreviation: 'CIN', mascot: 'Bearcats', city: 'Cincinnati', state: 'OH', stadium: 'Nippert Stadium', stadiumCapacity: 40000, colors: [{ name: 'Red', hex: '#E00122' }, { name: 'Black', hex: '#000000' }], headCoach: 'Scott Satterfield', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GoBearcatsFB', instagram: '@gobearcatsfb' }, bio: '', founded: 1819, conference: 'Big 12' },
      { id: 'colo', schoolName: 'University of Colorado', commonName: 'Colorado', abbreviation: 'COLO', mascot: 'Buffaloes', city: 'Boulder', state: 'CO', stadium: 'Folsom Field', stadiumCapacity: 50183, colors: [{ name: 'Gold', hex: '#CFB87C' }, { name: 'Silver', hex: '#A2A4A3' }, { name: 'Black', hex: '#000000' }], headCoach: 'Deion Sanders', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CUBuffsFootball', instagram: '@cubuffsfootball' }, bio: '', founded: 1876, conference: 'Big 12', joinedConference: 2024 },
      { id: 'hou', schoolName: 'University of Houston', commonName: 'Houston', abbreviation: 'HOU', mascot: 'Cougars', city: 'Houston', state: 'TX', stadium: 'TDECU Stadium', stadiumCapacity: 40000, colors: [{ name: 'Red', hex: '#C8102E' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Willie Fritz', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UHCougarFB', instagram: '@uhcougarfb' }, bio: '', founded: 1927, conference: 'Big 12' },
      { id: 'isu', schoolName: 'Iowa State University', commonName: 'Iowa State', abbreviation: 'ISU', mascot: 'Cyclones', city: 'Ames', state: 'IA', stadium: 'MidAmerican Energy Field at Jack Trice Stadium', stadiumCapacity: 61500, colors: [{ name: 'Cardinal', hex: '#C8102E' }, { name: 'Gold', hex: '#F1BE48' }], headCoach: 'TBD', headCoachSince: 2026, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CycloneFB', instagram: '@cyclonefb' }, bio: '', founded: 1858, conference: 'Big 12' },
      { id: 'ku', schoolName: 'University of Kansas', commonName: 'Kansas', abbreviation: 'KU', mascot: 'Jayhawks', city: 'Lawrence', state: 'KS', stadium: 'David Booth Kansas Memorial Stadium', stadiumCapacity: 47233, colors: [{ name: 'Crimson', hex: '#E8000D' }, { name: 'Blue', hex: '#0051BA' }], headCoach: 'Lance Leipold', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@KU_Football', instagram: '@ku_football' }, bio: '', founded: 1865, conference: 'Big 12' },
      { id: 'ksu', schoolName: 'Kansas State University', commonName: 'Kansas State', abbreviation: 'KSU', mascot: 'Wildcats', city: 'Manhattan', state: 'KS', stadium: 'Bill Snyder Family Stadium', stadiumCapacity: 50000, colors: [{ name: 'Purple', hex: '#512888' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Chris Klieman', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@KStateFB', instagram: '@kstatefb' }, bio: '', founded: 1863, conference: 'Big 12' },
      { id: 'okst', schoolName: 'Oklahoma State University', commonName: 'Oklahoma State', abbreviation: 'OKST', mascot: 'Cowboys', city: 'Stillwater', state: 'OK', stadium: 'Boone Pickens Stadium', stadiumCapacity: 55509, colors: [{ name: 'Orange', hex: '#FF6600' }, { name: 'Black', hex: '#000000' }], headCoach: 'Mike Gundy', headCoachSince: 2005, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CowboyFB', instagram: '@cowboyfb' }, bio: '', founded: 1890, conference: 'Big 12' },
      { id: 'tcu', schoolName: 'Texas Christian University', commonName: 'TCU', abbreviation: 'TCU', mascot: 'Horned Frogs', city: 'Fort Worth', state: 'TX', stadium: 'Amon G. Carter Stadium', stadiumCapacity: 47000, colors: [{ name: 'Purple', hex: '#4D1979' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Sonny Dykes', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TCUFootball', instagram: '@tcufootball' }, bio: '', founded: 1873, conference: 'Big 12' },
      { id: 'ttu', schoolName: 'Texas Tech University', commonName: 'Texas Tech', abbreviation: 'TTU', mascot: 'Red Raiders', city: 'Lubbock', state: 'TX', stadium: 'Jones AT&T Stadium', stadiumCapacity: 60454, colors: [{ name: 'Scarlet', hex: '#CC0000' }, { name: 'Black', hex: '#000000' }], headCoach: 'Joey McGuire', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TexasTechFB', instagram: '@texastechfb' }, bio: '', founded: 1923, conference: 'Big 12' },
      { id: 'ucf', schoolName: 'University of Central Florida', commonName: 'UCF', abbreviation: 'UCF', mascot: 'Knights', city: 'Orlando', state: 'FL', stadium: 'FBC Mortgage Stadium', stadiumCapacity: 44206, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#BA9B37' }], headCoach: 'Scott Frost', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UCF_Football', instagram: '@ucf_football' }, bio: '', founded: 1963, conference: 'Big 12' },
      { id: 'utah', schoolName: 'University of Utah', commonName: 'Utah', abbreviation: 'UTAH', mascot: 'Utes', city: 'Salt Lake City', state: 'UT', stadium: 'Rice-Eccles Stadium', stadiumCapacity: 51444, colors: [{ name: 'Crimson', hex: '#CC0000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Morgan Scalley', headCoachSince: 2025, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@Utah_Football', instagram: '@utah_football' }, bio: '', founded: 1850, conference: 'Big 12', joinedConference: 2024 },
      { id: 'wvu', schoolName: 'West Virginia University', commonName: 'West Virginia', abbreviation: 'WVU', mascot: 'Mountaineers', city: 'Morgantown', state: 'WV', stadium: 'Milan Puskar Stadium', stadiumCapacity: 60000, colors: [{ name: 'Gold', hex: '#EAAA00' }, { name: 'Blue', hex: '#002855' }], headCoach: 'Rich Rodriguez', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@WVUfootball', instagram: '@wvufootball' }, bio: '', founded: 1867, conference: 'Big 12' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SEC
  // ═══════════════════════════════════════════════════════════
  {
    id: 'sec',
    name: 'Southeastern Conference',
    abbreviation: 'SEC',
    tier: 'power4',
    commissioner: 'Greg Sankey',
    hqCity: 'Birmingham',
    hqState: 'AL',
    founded: 1932,
    teams: [
      { id: 'bama', schoolName: 'University of Alabama', commonName: 'Alabama', abbreviation: 'BAMA', mascot: 'Crimson Tide', city: 'Tuscaloosa', state: 'AL', stadium: 'Bryant-Denny Stadium', stadiumCapacity: 100077, colors: [{ name: 'Crimson', hex: '#9E1B32' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Kalen DeBoer', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AlabamaFTBL', instagram: '@alabamafbl' }, bio: '', founded: 1831, conference: 'SEC' },
      { id: 'ark', schoolName: 'University of Arkansas', commonName: 'Arkansas', abbreviation: 'ARK', mascot: 'Razorbacks', city: 'Fayetteville', state: 'AR', stadium: 'Donald W. Reynolds Razorback Stadium', stadiumCapacity: 76000, colors: [{ name: 'Cardinal', hex: '#9D2235' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Sam Pittman', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@RazorbackFB', instagram: '@razorbackfb' }, bio: '', founded: 1871, conference: 'SEC' },
      { id: 'aub', schoolName: 'Auburn University', commonName: 'Auburn', abbreviation: 'AUB', mascot: 'Tigers', city: 'Auburn', state: 'AL', stadium: 'Jordan-Hare Stadium', stadiumCapacity: 87451, colors: [{ name: 'Burnt Orange', hex: '#DD550C' }, { name: 'Navy Blue', hex: '#03244D' }], headCoach: 'Hugh Freeze', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AuburnFootball', instagram: '@auburnfootball' }, bio: '', founded: 1856, conference: 'SEC' },
      { id: 'uf', schoolName: 'University of Florida', commonName: 'Florida', abbreviation: 'UF', mascot: 'Gators', city: 'Gainesville', state: 'FL', stadium: 'Ben Hill Griffin Stadium (The Swamp)', stadiumCapacity: 88548, colors: [{ name: 'Orange', hex: '#FA4616' }, { name: 'Blue', hex: '#0021A5' }], headCoach: 'Billy Napier', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GatorsFB', instagram: '@gabornesfb' }, bio: '', founded: 1853, conference: 'SEC' },
      { id: 'uga', schoolName: 'University of Georgia', commonName: 'Georgia', abbreviation: 'UGA', mascot: 'Bulldogs', city: 'Athens', state: 'GA', stadium: 'Sanford Stadium (Between the Hedges)', stadiumCapacity: 92746, colors: [{ name: 'Bulldog Red', hex: '#BA0C2F' }, { name: 'Black', hex: '#000000' }], headCoach: 'Kirby Smart', headCoachSince: 2016, coachingStaff: [{ role: 'OC', name: 'Mike Bobo' }, { role: 'DC', name: 'Glenn Schumann' }], social: { twitter: '@GeorgiaFootball', instagram: '@georgiafootball' }, bio: '', founded: 1785, conference: 'SEC' },
      { id: 'uk', schoolName: 'University of Kentucky', commonName: 'Kentucky', abbreviation: 'UK', mascot: 'Wildcats', city: 'Lexington', state: 'KY', stadium: 'Kroger Field', stadiumCapacity: 61000, colors: [{ name: 'Blue', hex: '#0033A0' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Mark Stoops', headCoachSince: 2013, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UKFootball', instagram: '@ukfootball' }, bio: '', founded: 1865, conference: 'SEC' },
      { id: 'lsu', schoolName: 'Louisiana State University', commonName: 'LSU', abbreviation: 'LSU', mascot: 'Tigers', city: 'Baton Rouge', state: 'LA', stadium: 'Tiger Stadium (Death Valley)', stadiumCapacity: 102321, colors: [{ name: 'Purple', hex: '#461D7C' }, { name: 'Gold', hex: '#FDD023' }], headCoach: 'Lane Kiffin', headCoachSince: 2026, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@LSUfootball', instagram: '@lsufootball' }, bio: '', founded: 1860, conference: 'SEC' },
      { id: 'miss', schoolName: 'University of Mississippi', commonName: 'Ole Miss', abbreviation: 'MISS', mascot: 'Rebels', city: 'Oxford', state: 'MS', stadium: 'Vaught-Hemingway Stadium', stadiumCapacity: 64038, colors: [{ name: 'Cardinal Red', hex: '#CE1126' }, { name: 'Navy Blue', hex: '#14213D' }], headCoach: 'TBD', headCoachSince: 2026, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@OleMissFB', instagram: '@olemissfb' }, bio: '', founded: 1844, conference: 'SEC' },
      { id: 'msst', schoolName: 'Mississippi State University', commonName: 'Mississippi State', abbreviation: 'MSST', mascot: 'Bulldogs', city: 'Starkville', state: 'MS', stadium: 'Davis Wade Stadium', stadiumCapacity: 61337, colors: [{ name: 'Maroon', hex: '#660000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Jeff Lebby', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@HailStateFB', instagram: '@hailstatefb' }, bio: '', founded: 1878, conference: 'SEC' },
      { id: 'miz', schoolName: 'University of Missouri', commonName: 'Missouri', abbreviation: 'MIZ', mascot: 'Tigers', city: 'Columbia', state: 'MO', stadium: 'Faurot Field at Memorial Stadium', stadiumCapacity: 71168, colors: [{ name: 'Gold', hex: '#F1B82D' }, { name: 'Black', hex: '#000000' }], headCoach: 'Eli Drinkwitz', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MizzouFootball', instagram: '@mabornesfootball' }, bio: '', founded: 1839, conference: 'SEC' },
      { id: 'ou', schoolName: 'University of Oklahoma', commonName: 'Oklahoma', abbreviation: 'OU', mascot: 'Sooners', city: 'Norman', state: 'OK', stadium: 'Gaylord Family Oklahoma Memorial Stadium', stadiumCapacity: 80126, colors: [{ name: 'Crimson', hex: '#841617' }, { name: 'Cream', hex: '#FDF9D8' }], headCoach: 'Brent Venables', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@OU_Football', instagram: '@ou_football' }, bio: '', founded: 1890, conference: 'SEC', joinedConference: 2024 },
      { id: 'sc', schoolName: 'University of South Carolina', commonName: 'South Carolina', abbreviation: 'SC', mascot: 'Gamecocks', city: 'Columbia', state: 'SC', stadium: 'Williams-Brice Stadium', stadiumCapacity: 80250, colors: [{ name: 'Garnet', hex: '#73000A' }, { name: 'Black', hex: '#000000' }], headCoach: 'Shane Beamer', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GamecockFB', instagram: '@gamecockfb' }, bio: '', founded: 1801, conference: 'SEC' },
      { id: 'tenn', schoolName: 'University of Tennessee', commonName: 'Tennessee', abbreviation: 'TENN', mascot: 'Volunteers', city: 'Knoxville', state: 'TN', stadium: 'Neyland Stadium', stadiumCapacity: 102455, colors: [{ name: 'Tennessee Orange', hex: '#FF8200' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Josh Heupel', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@Vol_Football', instagram: '@vol_football' }, bio: '', founded: 1794, conference: 'SEC' },
      { id: 'tex', schoolName: 'University of Texas at Austin', commonName: 'Texas', abbreviation: 'TEX', mascot: 'Longhorns', city: 'Austin', state: 'TX', stadium: 'Darrell K Royal-Texas Memorial Stadium', stadiumCapacity: 100119, colors: [{ name: 'Burnt Orange', hex: '#BF5700' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Steve Sarkisian', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TexasFootball', instagram: '@texasfootball' }, bio: '', founded: 1883, conference: 'SEC', joinedConference: 2024 },
      { id: 'tamu', schoolName: 'Texas A&M University', commonName: 'Texas A&M', abbreviation: 'TAMU', mascot: 'Aggies', city: 'College Station', state: 'TX', stadium: 'Kyle Field', stadiumCapacity: 102733, colors: [{ name: 'Maroon', hex: '#500000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Mike Elko', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AggieFootball', instagram: '@aggiefootball' }, bio: '', founded: 1876, conference: 'SEC' },
      { id: 'van', schoolName: 'Vanderbilt University', commonName: 'Vanderbilt', abbreviation: 'VAN', mascot: 'Commodores', city: 'Nashville', state: 'TN', stadium: 'FirstBank Stadium', stadiumCapacity: 40550, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#CFAE70' }], headCoach: 'Clark Lea', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@VandyFootball', instagram: '@vandyfootball' }, bio: '', founded: 1873, conference: 'SEC' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP OF 5 — AMERICAN ATHLETIC CONFERENCE (AAC)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'aac',
    name: 'American Athletic Conference',
    abbreviation: 'AAC',
    tier: 'group_of_5',
    commissioner: 'Mike Aresco',
    hqCity: 'Irving',
    hqState: 'TX',
    founded: 2013,
    teams: [
      { id: 'army', schoolName: 'United States Military Academy', commonName: 'Army', abbreviation: 'ARMY', mascot: 'Black Knights', city: 'West Point', state: 'NY', stadium: 'Michie Stadium', stadiumCapacity: 38000, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#D4A843' }], headCoach: 'Jeff Monken', headCoachSince: 2014, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ArmyWP_Football', instagram: '@armywp_football', website: 'https://goarmywestpoint.com/sports/football' }, bio: '', founded: 1802, conference: 'AAC', joinedConference: 2024 },
      { id: 'char', schoolName: 'University of North Carolina at Charlotte', commonName: 'Charlotte', abbreviation: 'CLT', mascot: '49ers', city: 'Charlotte', state: 'NC', stadium: 'Jerry Richardson Stadium', stadiumCapacity: 15314, colors: [{ name: 'Green', hex: '#00703C' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Biff Poggi', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CharlotteFTBL', instagram: '@charlotteftbl', website: 'https://charlotte49ers.com/sports/football' }, bio: '', founded: 1946, conference: 'AAC' },
      { id: 'ecu', schoolName: 'East Carolina University', commonName: 'East Carolina', abbreviation: 'ECU', mascot: 'Pirates', city: 'Greenville', state: 'NC', stadium: 'Dowdy-Ficklen Stadium', stadiumCapacity: 50000, colors: [{ name: 'Purple', hex: '#592A8A' }, { name: 'Gold', hex: '#FFC72C' }], headCoach: 'Blake Harrell', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ECUPiratesFB', instagram: '@ecupiratesfb', website: 'https://ecupirates.com/sports/football' }, bio: '', founded: 1907, conference: 'AAC' },
      { id: 'fau', schoolName: 'Florida Atlantic University', commonName: 'Florida Atlantic', abbreviation: 'FAU', mascot: 'Owls', city: 'Boca Raton', state: 'FL', stadium: 'FAU Stadium', stadiumCapacity: 29419, colors: [{ name: 'Blue', hex: '#003366' }, { name: 'Red', hex: '#CC0000' }], headCoach: 'Tom Herman', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@FAUFootball', instagram: '@faufootball', website: 'https://fausports.com/sports/football' }, bio: '', founded: 1961, conference: 'AAC' },
      { id: 'mem', schoolName: 'University of Memphis', commonName: 'Memphis', abbreviation: 'MEM', mascot: 'Tigers', city: 'Memphis', state: 'TN', stadium: 'Simmons Bank Liberty Stadium', stadiumCapacity: 58325, colors: [{ name: 'Blue', hex: '#003087' }, { name: 'Gray', hex: '#898D8D' }], headCoach: 'Ryan Silverfield', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MemphisFB', instagram: '@memphisfb', website: 'https://gotigersgo.com/sports/football' }, bio: '', founded: 1912, conference: 'AAC' },
      { id: 'navy', schoolName: 'United States Naval Academy', commonName: 'Navy', abbreviation: 'NAVY', mascot: 'Midshipmen', city: 'Annapolis', state: 'MD', stadium: 'Navy-Marine Corps Memorial Stadium', stadiumCapacity: 34000, colors: [{ name: 'Navy Blue', hex: '#003B5C' }, { name: 'Gold', hex: '#C5B783' }], headCoach: 'Brian Newberry', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@NavyFB', instagram: '@navyfb', website: 'https://navysports.com/sports/football' }, bio: '', founded: 1845, conference: 'AAC' },
      { id: 'unt', schoolName: 'University of North Texas', commonName: 'North Texas', abbreviation: 'UNT', mascot: 'Mean Green', city: 'Denton', state: 'TX', stadium: 'DATCU Stadium', stadiumCapacity: 30850, colors: [{ name: 'Green', hex: '#00853E' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Eric Morris', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MeanGreenFB', instagram: '@meangreenfb', website: 'https://meangreensports.com/sports/football' }, bio: '', founded: 1890, conference: 'AAC' },
      { id: 'rice', schoolName: 'Rice University', commonName: 'Rice', abbreviation: 'RICE', mascot: 'Owls', city: 'Houston', state: 'TX', stadium: 'Rice Stadium', stadiumCapacity: 47000, colors: [{ name: 'Blue', hex: '#003D7C' }, { name: 'Gray', hex: '#C1C6C8' }], headCoach: 'Mike Bloomgren', headCoachSince: 2018, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@RiceFootball', instagram: '@ricefootball', website: 'https://riceowls.com/sports/football' }, bio: '', founded: 1912, conference: 'AAC' },
      { id: 'usf', schoolName: 'University of South Florida', commonName: 'South Florida', abbreviation: 'USF', mascot: 'Bulls', city: 'Tampa', state: 'FL', stadium: 'Raymond James Stadium', stadiumCapacity: 65618, colors: [{ name: 'Green', hex: '#006747' }, { name: 'Gold', hex: '#CFC493' }], headCoach: 'Alex Golesh', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@USFFootball', instagram: '@usffootball', website: 'https://gousfbulls.com/sports/football' }, bio: '', founded: 1956, conference: 'AAC' },
      { id: 'temple', schoolName: 'Temple University', commonName: 'Temple', abbreviation: 'TEM', mascot: 'Owls', city: 'Philadelphia', state: 'PA', stadium: 'Lincoln Financial Field', stadiumCapacity: 68532, colors: [{ name: 'Cherry', hex: '#9D2235' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Stan Drayton', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@Temple_FB', instagram: '@temple_fb', website: 'https://owlsports.com/sports/football' }, bio: '', founded: 1884, conference: 'AAC' },
      { id: 'tulane', schoolName: 'Tulane University', commonName: 'Tulane', abbreviation: 'TULN', mascot: 'Green Wave', city: 'New Orleans', state: 'LA', stadium: 'Yulman Stadium', stadiumCapacity: 30000, colors: [{ name: 'Olive Green', hex: '#006747' }, { name: 'Sky Blue', hex: '#418FDE' }], headCoach: 'Jon Sumrall', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GreenWaveFB', instagram: '@greenwavefb', website: 'https://tulanegreenwave.com/sports/football' }, bio: '', founded: 1834, conference: 'AAC' },
      { id: 'tulsa', schoolName: 'University of Tulsa', commonName: 'Tulsa', abbreviation: 'TLSA', mascot: 'Golden Hurricane', city: 'Tulsa', state: 'OK', stadium: 'Skelly Field at H.A. Chapman Stadium', stadiumCapacity: 30000, colors: [{ name: 'Old Gold', hex: '#C8A500' }, { name: 'Royal Blue', hex: '#002D62' }], headCoach: 'Kevin Wilson', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TulsaFootball', instagram: '@tulsafootball', website: 'https://tulsahurricane.com/sports/football' }, bio: '', founded: 1894, conference: 'AAC' },
      { id: 'uab', schoolName: 'University of Alabama at Birmingham', commonName: 'UAB', abbreviation: 'UAB', mascot: 'Blazers', city: 'Birmingham', state: 'AL', stadium: 'Protective Stadium', stadiumCapacity: 47100, colors: [{ name: 'Green', hex: '#1E6B52' }, { name: 'Gold', hex: '#FFC845' }], headCoach: 'Trent Dilfer', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UAB_FB', instagram: '@uab_fb', website: 'https://uabsports.com/sports/football' }, bio: '', founded: 1969, conference: 'AAC' },
      { id: 'utsa', schoolName: 'University of Texas at San Antonio', commonName: 'UTSA', abbreviation: 'UTSA', mascot: 'Roadrunners', city: 'San Antonio', state: 'TX', stadium: 'Alamodome', stadiumCapacity: 64000, colors: [{ name: 'Blue', hex: '#0C2340' }, { name: 'Orange', hex: '#F15A22' }], headCoach: 'Jeff Traylor', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UTSAFTBL', instagram: '@utsaftbl', website: 'https://goutsa.com/sports/football' }, bio: '', founded: 1969, conference: 'AAC' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP OF 5 — CONFERENCE USA (C-USA)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'cusa',
    name: 'Conference USA',
    abbreviation: 'C-USA',
    tier: 'group_of_5',
    commissioner: 'Judy MacLeod',
    hqCity: 'Dallas',
    hqState: 'TX',
    founded: 1995,
    teams: [
      { id: 'fiu', schoolName: 'Florida International University', commonName: 'FIU', abbreviation: 'FIU', mascot: 'Panthers', city: 'Miami', state: 'FL', stadium: 'Riccardo Silva Stadium', stadiumCapacity: 20000, colors: [{ name: 'Blue', hex: '#002F65' }, { name: 'Gold', hex: '#B6862C' }], headCoach: 'Mike MacIntyre', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@FIUFootball', instagram: '@fiufootball', website: 'https://fiusports.com/sports/football' }, bio: '', founded: 1965, conference: 'C-USA' },
      { id: 'jaxst', schoolName: 'Jacksonville State University', commonName: 'Jacksonville State', abbreviation: 'JSU', mascot: 'Gamecocks', city: 'Jacksonville', state: 'AL', stadium: 'Burgess-Snow Field at JSU Stadium', stadiumCapacity: 24000, colors: [{ name: 'Red', hex: '#CC0000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Rich Rodriguez', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@JSUGamecockFB', instagram: '@jsugamecockfb', website: 'https://jsugamecocksports.com/sports/football' }, bio: '', founded: 1883, conference: 'C-USA' },
      { id: 'ksu-g5', schoolName: 'Kennesaw State University', commonName: 'Kennesaw State', abbreviation: 'KSU', mascot: 'Owls', city: 'Kennesaw', state: 'GA', stadium: 'Fifth Third Bank Stadium', stadiumCapacity: 10200, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#FDBB30' }], headCoach: 'Brian Bohannon', headCoachSince: 2014, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@KSUOwlsFB', instagram: '@ksuowlsfb', website: 'https://ksuowls.com/sports/football' }, bio: '', founded: 1963, conference: 'C-USA' },
      { id: 'lib', schoolName: 'Liberty University', commonName: 'Liberty', abbreviation: 'LIB', mascot: 'Flames', city: 'Lynchburg', state: 'VA', stadium: 'Williams Stadium', stadiumCapacity: 25000, colors: [{ name: 'Red', hex: '#AE132A' }, { name: 'Blue', hex: '#002D62' }], headCoach: 'Jamey Chadwell', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@LibertyFootball', instagram: '@libertyfootball', website: 'https://libertyflames.com/sports/football' }, bio: '', founded: 1971, conference: 'C-USA' },
      { id: 'latech', schoolName: 'Louisiana Tech University', commonName: 'Louisiana Tech', abbreviation: 'LT', mascot: 'Bulldogs', city: 'Ruston', state: 'LA', stadium: 'Joe Aillet Stadium', stadiumCapacity: 28000, colors: [{ name: 'Blue', hex: '#002F8B' }, { name: 'Red', hex: '#CF0A2C' }], headCoach: 'Sonny Cumbie', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@LATechFB', instagram: '@latechfb', website: 'https://latechsports.com/sports/football' }, bio: '', founded: 1894, conference: 'C-USA' },
      { id: 'mtsu', schoolName: 'Middle Tennessee State University', commonName: 'Middle Tennessee', abbreviation: 'MTSU', mascot: 'Blue Raiders', city: 'Murfreesboro', state: 'TN', stadium: 'Johnny "Red" Floyd Stadium', stadiumCapacity: 30788, colors: [{ name: 'Blue', hex: '#0066CC' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Derek Mason', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MT_FB', instagram: '@mt_fb', website: 'https://goblueraiders.com/sports/football' }, bio: '', founded: 1911, conference: 'C-USA' },
      { id: 'nmsu', schoolName: 'New Mexico State University', commonName: 'New Mexico State', abbreviation: 'NMSU', mascot: 'Aggies', city: 'Las Cruces', state: 'NM', stadium: 'Aggie Memorial Stadium', stadiumCapacity: 30343, colors: [{ name: 'Crimson', hex: '#8B0000' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Tony Sanchez', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@NMStateFootball', instagram: '@nmstatefootball', website: 'https://nmstatesports.com/sports/football' }, bio: '', founded: 1888, conference: 'C-USA' },
      { id: 'shsu', schoolName: 'Sam Houston State University', commonName: 'Sam Houston', abbreviation: 'SHSU', mascot: 'Bearkats', city: 'Huntsville', state: 'TX', stadium: 'Bowers Stadium', stadiumCapacity: 14000, colors: [{ name: 'Orange', hex: '#FF5F05' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'K.C. Keeler', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BearkatsFB', instagram: '@bearkatsfb', website: 'https://gobearkats.com/sports/football' }, bio: '', founded: 1879, conference: 'C-USA' },
      { id: 'wku', schoolName: 'Western Kentucky University', commonName: 'Western Kentucky', abbreviation: 'WKU', mascot: 'Hilltoppers', city: 'Bowling Green', state: 'KY', stadium: 'Houchens Industries-L.T. Smith Stadium', stadiumCapacity: 22113, colors: [{ name: 'Red', hex: '#B01E24' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Tyson Helton', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@WKUFootball', instagram: '@wkufootball', website: 'https://wkusports.com/sports/football' }, bio: '', founded: 1906, conference: 'C-USA' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP OF 5 — MID-AMERICAN CONFERENCE (MAC)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'mac',
    name: 'Mid-American Conference',
    abbreviation: 'MAC',
    tier: 'group_of_5',
    commissioner: 'Jon Steinbrecher',
    hqCity: 'Cleveland',
    hqState: 'OH',
    founded: 1946,
    teams: [
      { id: 'akron', schoolName: 'University of Akron', commonName: 'Akron', abbreviation: 'AKR', mascot: 'Zips', city: 'Akron', state: 'OH', stadium: 'InfoCision Stadium', stadiumCapacity: 30000, colors: [{ name: 'Blue', hex: '#041E42' }, { name: 'Gold', hex: '#A89968' }], headCoach: 'Joe Moorhead', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ZipsFB', instagram: '@zipsfb', website: 'https://gozips.com/sports/football' }, bio: '', founded: 1870, conference: 'MAC', division: 'East' },
      { id: 'ballst', schoolName: 'Ball State University', commonName: 'Ball State', abbreviation: 'BALL', mascot: 'Cardinals', city: 'Muncie', state: 'IN', stadium: 'Scheumann Stadium', stadiumCapacity: 22500, colors: [{ name: 'Cardinal', hex: '#BA0C2F' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Mike Neu', headCoachSince: 2016, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BallStateFB', instagram: '@ballstatefb', website: 'https://ballstatesports.com/sports/football' }, bio: '', founded: 1918, conference: 'MAC', division: 'West' },
      { id: 'bgsu', schoolName: 'Bowling Green State University', commonName: 'Bowling Green', abbreviation: 'BGSU', mascot: 'Falcons', city: 'Bowling Green', state: 'OH', stadium: 'Doyt Perry Stadium', stadiumCapacity: 23724, colors: [{ name: 'Burnt Orange', hex: '#FF7300' }, { name: 'Brown', hex: '#4F2C1D' }], headCoach: 'Scot Loeffler', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BG_Football', instagram: '@bg_football', website: 'https://bgsufalcons.com/sports/football' }, bio: '', founded: 1910, conference: 'MAC', division: 'East' },
      { id: 'buf', schoolName: 'University at Buffalo', commonName: 'Buffalo', abbreviation: 'BUFF', mascot: 'Bulls', city: 'Buffalo', state: 'NY', stadium: 'UB Stadium', stadiumCapacity: 31122, colors: [{ name: 'UB Blue', hex: '#005BBB' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Pete Lembo', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UBFootball', instagram: '@ubfootball', website: 'https://ubbulls.com/sports/football' }, bio: '', founded: 1846, conference: 'MAC', division: 'East' },
      { id: 'cmu', schoolName: 'Central Michigan University', commonName: 'Central Michigan', abbreviation: 'CMU', mascot: 'Chippewas', city: 'Mount Pleasant', state: 'MI', stadium: 'Kelly/Shorts Stadium', stadiumCapacity: 30199, colors: [{ name: 'Maroon', hex: '#6A0032' }, { name: 'Gold', hex: '#FFC82E' }], headCoach: 'Jim McElwain', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CMU_Football', instagram: '@cmu_football', website: 'https://cmuchippewas.com/sports/football' }, bio: '', founded: 1892, conference: 'MAC', division: 'West' },
      { id: 'emu', schoolName: 'Eastern Michigan University', commonName: 'Eastern Michigan', abbreviation: 'EMU', mascot: 'Eagles', city: 'Ypsilanti', state: 'MI', stadium: 'Rynearson Stadium', stadiumCapacity: 30200, colors: [{ name: 'Dark Green', hex: '#006633' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Chris Creighton', headCoachSince: 2014, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@EMUFB', instagram: '@emufb', website: 'https://emueagles.com/sports/football' }, bio: '', founded: 1849, conference: 'MAC', division: 'West' },
      { id: 'kent', schoolName: 'Kent State University', commonName: 'Kent State', abbreviation: 'KENT', mascot: 'Golden Flashes', city: 'Kent', state: 'OH', stadium: 'Dix Stadium', stadiumCapacity: 25319, colors: [{ name: 'Navy Blue', hex: '#002664' }, { name: 'Gold', hex: '#EAAB00' }], headCoach: 'Kenni Burns', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@KentStateFB', instagram: '@kentstatefb', website: 'https://kentstatesports.com/sports/football' }, bio: '', founded: 1910, conference: 'MAC', division: 'East' },
      { id: 'miaoh', schoolName: 'Miami University', commonName: 'Miami (OH)', abbreviation: 'M-OH', mascot: 'RedHawks', city: 'Oxford', state: 'OH', stadium: 'Yager Stadium', stadiumCapacity: 24286, colors: [{ name: 'Red', hex: '#C3002F' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Chuck Martin', headCoachSince: 2014, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@MiamiOHFootball', instagram: '@miamiohfootball', website: 'https://miamiredhawks.com/sports/football' }, bio: '', founded: 1809, conference: 'MAC', division: 'East' },
      { id: 'niu', schoolName: 'Northern Illinois University', commonName: 'Northern Illinois', abbreviation: 'NIU', mascot: 'Huskies', city: 'DeKalb', state: 'IL', stadium: 'Huskie Stadium', stadiumCapacity: 24000, colors: [{ name: 'Cardinal Red', hex: '#BA0C2F' }, { name: 'Black', hex: '#000000' }], headCoach: 'Thomas Hammock', headCoachSince: 2019, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@NIU_Football', instagram: '@niu_football', website: 'https://niuhuskies.com/sports/football' }, bio: '', founded: 1895, conference: 'MAC', division: 'West' },
      { id: 'ohio', schoolName: 'Ohio University', commonName: 'Ohio', abbreviation: 'OHIO', mascot: 'Bobcats', city: 'Athens', state: 'OH', stadium: 'Peden Stadium', stadiumCapacity: 24000, colors: [{ name: 'Hunter Green', hex: '#00694E' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Tim Albin', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@OhioFootball', instagram: '@ohiofootball', website: 'https://ohiobobcats.com/sports/football' }, bio: '', founded: 1804, conference: 'MAC', division: 'East' },
      { id: 'tol', schoolName: 'University of Toledo', commonName: 'Toledo', abbreviation: 'TOL', mascot: 'Rockets', city: 'Toledo', state: 'OH', stadium: 'Glass Bowl', stadiumCapacity: 26248, colors: [{ name: 'Midnight Blue', hex: '#00205C' }, { name: 'Gold', hex: '#FFCE00' }], headCoach: 'Jason Candle', headCoachSince: 2016, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ToledoFB', instagram: '@toledofb', website: 'https://utrockets.com/sports/football' }, bio: '', founded: 1872, conference: 'MAC', division: 'West' },
      { id: 'wmu', schoolName: 'Western Michigan University', commonName: 'Western Michigan', abbreviation: 'WMU', mascot: 'Broncos', city: 'Kalamazoo', state: 'MI', stadium: 'Waldo Stadium', stadiumCapacity: 30200, colors: [{ name: 'Brown', hex: '#4E3629' }, { name: 'Gold', hex: '#B5A36A' }], headCoach: 'Lance Taylor', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@WMU_Football', instagram: '@wmu_football', website: 'https://wmubroncos.com/sports/football' }, bio: '', founded: 1903, conference: 'MAC', division: 'West' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP OF 5 — MOUNTAIN WEST CONFERENCE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'mw',
    name: 'Mountain West Conference',
    abbreviation: 'MW',
    tier: 'group_of_5',
    commissioner: 'Gloria Nevarez',
    hqCity: 'Colorado Springs',
    hqState: 'CO',
    founded: 1999,
    teams: [
      { id: 'af', schoolName: 'United States Air Force Academy', commonName: 'Air Force', abbreviation: 'AF', mascot: 'Falcons', city: 'Colorado Springs', state: 'CO', stadium: 'Falcon Stadium', stadiumCapacity: 46692, colors: [{ name: 'Blue', hex: '#003087' }, { name: 'Silver', hex: '#8F8F8C' }], headCoach: 'Troy Calhoun', headCoachSince: 2007, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AF_Football', instagram: '@af_football', website: 'https://goairforcefalcons.com/sports/football' }, bio: '', founded: 1954, conference: 'Mountain West' },
      { id: 'boise', schoolName: 'Boise State University', commonName: 'Boise State', abbreviation: 'BSU', mascot: 'Broncos', city: 'Boise', state: 'ID', stadium: 'Albertsons Stadium (The Blue)', stadiumCapacity: 36387, colors: [{ name: 'Blue', hex: '#0033A0' }, { name: 'Orange', hex: '#D64309' }], headCoach: 'Spencer Danielson', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@BroncoSportsFB', instagram: '@broncosportsfb', website: 'https://broncosports.com/sports/football' }, bio: '', founded: 1932, conference: 'Mountain West' },
      { id: 'csu', schoolName: 'Colorado State University', commonName: 'Colorado State', abbreviation: 'CSU', mascot: 'Rams', city: 'Fort Collins', state: 'CO', stadium: 'Canvas Stadium', stadiumCapacity: 36500, colors: [{ name: 'Green', hex: '#1E4D2B' }, { name: 'Gold', hex: '#C8C372' }], headCoach: 'Jay Norvell', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CSUFootball', instagram: '@csufootball', website: 'https://csurams.com/sports/football' }, bio: '', founded: 1870, conference: 'Mountain West' },
      { id: 'fresno', schoolName: 'California State University, Fresno', commonName: 'Fresno State', abbreviation: 'FRES', mascot: 'Bulldogs', city: 'Fresno', state: 'CA', stadium: 'Valley Children\'s Stadium', stadiumCapacity: 40727, colors: [{ name: 'Cardinal', hex: '#DB0032' }, { name: 'Blue', hex: '#002E6D' }], headCoach: 'Tim Skipper', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@FresnoStateFB', instagram: '@fresnostatefb', website: 'https://gobulldogs.com/sports/football' }, bio: '', founded: 1911, conference: 'Mountain West' },
      { id: 'hawaii', schoolName: 'University of Hawaii at Manoa', commonName: 'Hawaii', abbreviation: 'HAW', mascot: 'Rainbow Warriors', city: 'Honolulu', state: 'HI', stadium: 'Ching Complex', stadiumCapacity: 9300, colors: [{ name: 'Green', hex: '#024731' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#000000' }], headCoach: 'Timmy Chang', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@HawaiiFootball', instagram: '@hawaiifootball', website: 'https://hawaiiathletics.com/sports/football' }, bio: '', founded: 1907, conference: 'Mountain West' },
      { id: 'nev', schoolName: 'University of Nevada, Reno', commonName: 'Nevada', abbreviation: 'NEV', mascot: 'Wolf Pack', city: 'Reno', state: 'NV', stadium: 'Mackay Stadium', stadiumCapacity: 30000, colors: [{ name: 'Navy Blue', hex: '#003366' }, { name: 'Silver', hex: '#A7A8AA' }], headCoach: 'Jeff Choate', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@NevadaFootball', instagram: '@nevadafootball', website: 'https://nevadawolfpack.com/sports/football' }, bio: '', founded: 1874, conference: 'Mountain West' },
      { id: 'unm', schoolName: 'University of New Mexico', commonName: 'New Mexico', abbreviation: 'UNM', mascot: 'Lobos', city: 'Albuquerque', state: 'NM', stadium: 'University Stadium', stadiumCapacity: 39224, colors: [{ name: 'Cherry', hex: '#BA0C2F' }, { name: 'Silver', hex: '#A7A8AA' }], headCoach: 'Bronco Mendenhall', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UNMLoboFB', instagram: '@unmlobofb', website: 'https://golobos.com/sports/football' }, bio: '', founded: 1889, conference: 'Mountain West' },
      { id: 'sdsu', schoolName: 'San Diego State University', commonName: 'San Diego State', abbreviation: 'SDSU', mascot: 'Aztecs', city: 'San Diego', state: 'CA', stadium: 'Snapdragon Stadium', stadiumCapacity: 35000, colors: [{ name: 'Scarlet', hex: '#A6192E' }, { name: 'Black', hex: '#000000' }], headCoach: 'Sean Lewis', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AztecFB', instagram: '@aztecfb', website: 'https://goaztecs.com/sports/football' }, bio: '', founded: 1897, conference: 'Mountain West' },
      { id: 'sjsu', schoolName: 'San Jose State University', commonName: 'San Jose State', abbreviation: 'SJSU', mascot: 'Spartans', city: 'San Jose', state: 'CA', stadium: 'CEFCU Stadium', stadiumCapacity: 30456, colors: [{ name: 'Blue', hex: '#0055A2' }, { name: 'Gold', hex: '#E5A823' }], headCoach: 'Ken Niumatalolo', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@SanJoseStateFB', instagram: '@sanjosestatefb', website: 'https://sjsuspartans.com/sports/football' }, bio: '', founded: 1857, conference: 'Mountain West' },
      { id: 'unlv', schoolName: 'University of Nevada, Las Vegas', commonName: 'UNLV', abbreviation: 'UNLV', mascot: 'Rebels', city: 'Las Vegas', state: 'NV', stadium: 'Allegiant Stadium', stadiumCapacity: 65000, colors: [{ name: 'Scarlet', hex: '#CF0A2C' }, { name: 'Gray', hex: '#666666' }], headCoach: 'Dan Mullen', headCoachSince: 2025, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UNLVFootball', instagram: '@unlvfootball', website: 'https://unlvrebels.com/sports/football' }, bio: '', founded: 1957, conference: 'Mountain West' },
      { id: 'usu', schoolName: 'Utah State University', commonName: 'Utah State', abbreviation: 'USU', mascot: 'Aggies', city: 'Logan', state: 'UT', stadium: 'Maverik Stadium', stadiumCapacity: 25513, colors: [{ name: 'Aggie Blue', hex: '#0F2439' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Nate Dreiling', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@USUFootball', instagram: '@usufootball', website: 'https://utahstateaggies.com/sports/football' }, bio: '', founded: 1888, conference: 'Mountain West' },
      { id: 'wyo', schoolName: 'University of Wyoming', commonName: 'Wyoming', abbreviation: 'WYO', mascot: 'Cowboys', city: 'Laramie', state: 'WY', stadium: 'War Memorial Stadium', stadiumCapacity: 29181, colors: [{ name: 'Brown', hex: '#492F24' }, { name: 'Gold', hex: '#FFC425' }], headCoach: 'Jay Sawvel', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@wabornesfootball', instagram: '@wabornesfootball', website: 'https://gowyo.com/sports/football' }, bio: '', founded: 1886, conference: 'Mountain West' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP OF 5 — SUN BELT CONFERENCE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'sunbelt',
    name: 'Sun Belt Conference',
    abbreviation: 'SBC',
    tier: 'group_of_5',
    commissioner: 'Keith Gill',
    hqCity: 'New Orleans',
    hqState: 'LA',
    founded: 1976,
    teams: [
      { id: 'appst', schoolName: 'Appalachian State University', commonName: 'Appalachian State', abbreviation: 'APP', mascot: 'Mountaineers', city: 'Boone', state: 'NC', stadium: 'Kidd Brewer Stadium', stadiumCapacity: 30000, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#FFCC00' }], headCoach: 'Shawn Clark', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AppState_FB', instagram: '@appstate_fb', website: 'https://appstatesports.com/sports/football' }, bio: '', founded: 1899, conference: 'Sun Belt', division: 'East' },
      { id: 'arkst', schoolName: 'Arkansas State University', commonName: 'Arkansas State', abbreviation: 'ARST', mascot: 'Red Wolves', city: 'Jonesboro', state: 'AR', stadium: 'Centennial Bank Stadium', stadiumCapacity: 30406, colors: [{ name: 'Scarlet', hex: '#CC092F' }, { name: 'Black', hex: '#000000' }], headCoach: 'Butch Jones', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@AStateFB', instagram: '@astatefb', website: 'https://astateredwolves.com/sports/football' }, bio: '', founded: 1909, conference: 'Sun Belt', division: 'West' },
      { id: 'ccu', schoolName: 'Coastal Carolina University', commonName: 'Coastal Carolina', abbreviation: 'CCU', mascot: 'Chanticleers', city: 'Conway', state: 'SC', stadium: 'Brooks Stadium', stadiumCapacity: 21000, colors: [{ name: 'Teal', hex: '#006F71' }, { name: 'Bronze', hex: '#A27752' }], headCoach: 'Tim Beck', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@CoastalFootball', instagram: '@coastalfootball', website: 'https://goccusports.com/sports/football' }, bio: '', founded: 1954, conference: 'Sun Belt', division: 'East' },
      { id: 'gasou', schoolName: 'Georgia Southern University', commonName: 'Georgia Southern', abbreviation: 'GASO', mascot: 'Eagles', city: 'Statesboro', state: 'GA', stadium: 'Paulson Stadium', stadiumCapacity: 25000, colors: [{ name: 'Blue', hex: '#041E42' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Clay Helton', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GSAthletics_FB', instagram: '@gsathletics_fb', website: 'https://gseagles.com/sports/football' }, bio: '', founded: 1906, conference: 'Sun Belt', division: 'East' },
      { id: 'gast', schoolName: 'Georgia State University', commonName: 'Georgia State', abbreviation: 'GAST', mascot: 'Panthers', city: 'Atlanta', state: 'GA', stadium: 'Center Parc Credit Union Stadium', stadiumCapacity: 24333, colors: [{ name: 'Blue', hex: '#0039A6' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Red', hex: '#CC0000' }], headCoach: 'Dell McGee', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@GeorgiaStateFB', instagram: '@georgiastatefb', website: 'https://georgiastatesports.com/sports/football' }, bio: '', founded: 1913, conference: 'Sun Belt', division: 'East' },
      { id: 'jmu', schoolName: 'James Madison University', commonName: 'James Madison', abbreviation: 'JMU', mascot: 'Dukes', city: 'Harrisonburg', state: 'VA', stadium: 'Bridgeforth Stadium', stadiumCapacity: 25000, colors: [{ name: 'Royal Purple', hex: '#450084' }, { name: 'Gold', hex: '#CBB677' }], headCoach: 'Bob Chesney', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@JMUFootball', instagram: '@jmufootball', website: 'https://jmusports.com/sports/football' }, bio: '', founded: 1908, conference: 'Sun Belt', division: 'East' },
      { id: 'ull', schoolName: 'University of Louisiana at Lafayette', commonName: 'Louisiana', abbreviation: 'ULL', mascot: 'Ragin\' Cajuns', city: 'Lafayette', state: 'LA', stadium: 'Cajun Field', stadiumCapacity: 41426, colors: [{ name: 'Vermilion', hex: '#CE181E' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Michael Desormeaux', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@RaginCajunsFB', instagram: '@ragincajunsfb', website: 'https://ragincajuns.com/sports/football' }, bio: '', founded: 1898, conference: 'Sun Belt', division: 'West' },
      { id: 'ulm', schoolName: 'University of Louisiana at Monroe', commonName: 'Louisiana-Monroe', abbreviation: 'ULM', mascot: 'Warhawks', city: 'Monroe', state: 'LA', stadium: 'Malone Stadium', stadiumCapacity: 30427, colors: [{ name: 'Maroon', hex: '#840029' }, { name: 'Gold', hex: '#A98A4E' }], headCoach: 'Bryant Vincent', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ULM_FB', instagram: '@ulm_fb', website: 'https://ulmwarhawks.com/sports/football' }, bio: '', founded: 1931, conference: 'Sun Belt', division: 'West' },
      { id: 'marshall', schoolName: 'Marshall University', commonName: 'Marshall', abbreviation: 'MRSH', mascot: 'Thundering Herd', city: 'Huntington', state: 'WV', stadium: 'Joan C. Edwards Stadium', stadiumCapacity: 38019, colors: [{ name: 'Kelly Green', hex: '#00B140' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Charles Huff', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@HerdFB', instagram: '@herdfb', website: 'https://herdzone.com/sports/football' }, bio: '', founded: 1837, conference: 'Sun Belt', division: 'East' },
      { id: 'odu', schoolName: 'Old Dominion University', commonName: 'Old Dominion', abbreviation: 'ODU', mascot: 'Monarchs', city: 'Norfolk', state: 'VA', stadium: 'S.B. Ballard Stadium', stadiumCapacity: 21944, colors: [{ name: 'Slate Blue', hex: '#003057' }, { name: 'Silver', hex: '#A7A8AA' }], headCoach: 'Ricky Rahne', headCoachSince: 2020, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ODUFootball', instagram: '@odufootball', website: 'https://odusports.com/sports/football' }, bio: '', founded: 1930, conference: 'Sun Belt', division: 'East' },
      { id: 'soal', schoolName: 'University of South Alabama', commonName: 'South Alabama', abbreviation: 'USA', mascot: 'Jaguars', city: 'Mobile', state: 'AL', stadium: 'Hancock Whitney Stadium', stadiumCapacity: 25000, colors: [{ name: 'Red', hex: '#C41230' }, { name: 'Blue', hex: '#00205B' }], headCoach: 'Major Applewhite', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@SouthAlabamaFB', instagram: '@southalabamafb', website: 'https://usajaguars.com/sports/football' }, bio: '', founded: 1963, conference: 'Sun Belt', division: 'West' },
      { id: 'usm', schoolName: 'University of Southern Mississippi', commonName: 'Southern Miss', abbreviation: 'USM', mascot: 'Golden Eagles', city: 'Hattiesburg', state: 'MS', stadium: 'M.M. Roberts Stadium', stadiumCapacity: 36000, colors: [{ name: 'Black', hex: '#000000' }, { name: 'Gold', hex: '#FFB81C' }], headCoach: 'Will Hall', headCoachSince: 2021, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@SouthernMissFB', instagram: '@southernmissfb', website: 'https://southernmiss.com/sports/football' }, bio: '', founded: 1910, conference: 'Sun Belt', division: 'West' },
      { id: 'txst', schoolName: 'Texas State University', commonName: 'Texas State', abbreviation: 'TXST', mascot: 'Bobcats', city: 'San Marcos', state: 'TX', stadium: 'UFCU Stadium', stadiumCapacity: 30000, colors: [{ name: 'Maroon', hex: '#501214' }, { name: 'Gold', hex: '#8D734A' }], headCoach: 'G.J. Kinne', headCoachSince: 2024, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@ABORNESFB', instagram: '@abornesfb', website: 'https://txstatebobcats.com/sports/football' }, bio: '', founded: 1899, conference: 'Sun Belt', division: 'West' },
      { id: 'troy', schoolName: 'Troy University', commonName: 'Troy', abbreviation: 'TROY', mascot: 'Trojans', city: 'Troy', state: 'AL', stadium: 'Veterans Memorial Stadium', stadiumCapacity: 30000, colors: [{ name: 'Cardinal', hex: '#8B2332' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Gerad Parker', headCoachSince: 2023, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@TroyTrojansFB', instagram: '@troytrojansfb', website: 'https://troytrojans.com/sports/football' }, bio: '', founded: 1887, conference: 'Sun Belt', division: 'West' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Fill in auto-generated bios
// ─────────────────────────────────────────────────────────────

CONFERENCES.forEach(conf => {
  conf.teams.forEach(team => {
    if (!team.bio) {
      team.bio = schoolBio(team.schoolName, team.city, team.state, team.founded, conf.name, team.mascot, team.stadium, team.stadiumCapacity);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Independents
// ─────────────────────────────────────────────────────────────

export const INDEPENDENTS: Team[] = [
  { id: 'nd', schoolName: 'University of Notre Dame', commonName: 'Notre Dame', abbreviation: 'ND', mascot: 'Fighting Irish', city: 'Notre Dame', state: 'IN', stadium: 'Notre Dame Stadium', stadiumCapacity: 77622, colors: [{ name: 'Notre Dame Blue', hex: '#0C2340' }, { name: 'Dome Gold', hex: '#C99700' }, { name: 'Irish Green', hex: '#00843D' }], headCoach: 'Marcus Freeman', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'Mike Denbrock' }, { role: 'DC', name: 'Al Golden' }], social: { twitter: '@NDFootball', instagram: '@ndfootball' }, bio: 'University of Notre Dame, located in Notre Dame, Indiana, is one of the most storied programs in college football history. An FBS Independent for football (ACC for all other sports), the Fighting Irish play at Notre Dame Stadium (capacity: 77,622), known as "The House That Rockne Built."', founded: 1842, conference: 'Independent' },
  { id: 'uconn', schoolName: 'University of Connecticut', commonName: 'UConn', abbreviation: 'UCONN', mascot: 'Huskies', city: 'Storrs', state: 'CT', stadium: 'Pratt & Whitney Stadium at Rentschler Field', stadiumCapacity: 38066, colors: [{ name: 'National Flag Blue', hex: '#000E2F' }, { name: 'White', hex: '#FFFFFF' }], headCoach: 'Jim Mora Jr.', headCoachSince: 2022, coachingStaff: [{ role: 'OC', name: 'TBD' }, { role: 'DC', name: 'TBD' }], social: { twitter: '@UConnFootball', instagram: '@uconnfootball' }, bio: 'University of Connecticut, located in Storrs, Connecticut. An FBS Independent for football (Big East for all other sports), the Huskies compete from Pratt & Whitney Stadium (capacity: 38,066).', founded: 1881, conference: 'Independent' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getAllTeams(): Team[] {
  const confTeams = CONFERENCES.flatMap(c => c.teams);
  return [...confTeams, ...INDEPENDENTS];
}

export function getTeamById(id: string): Team | undefined {
  return getAllTeams().find(t => t.id === id);
}

export function getConferenceById(id: string): Conference | undefined {
  return CONFERENCES.find(c => c.id === id);
}

export function getPower4(): Conference[] {
  return CONFERENCES.filter(c => c.tier === 'power4');
}

export function getGroupOf5(): Conference[] {
  return CONFERENCES.filter(c => c.tier === 'group_of_5');
}

export function getTeamsByConference(confId: string): Team[] {
  const conf = CONFERENCES.find(c => c.id === confId);
  return conf ? conf.teams : [];
}

export function searchTeams(query: string): Team[] {
  const q = query.toLowerCase();
  return getAllTeams().filter(t =>
    t.commonName.toLowerCase().includes(q) ||
    t.abbreviation.toLowerCase().includes(q) ||
    t.mascot.toLowerCase().includes(q) ||
    t.city.toLowerCase().includes(q) ||
    t.state.toLowerCase().includes(q) ||
    t.headCoach.toLowerCase().includes(q)
  );
}
