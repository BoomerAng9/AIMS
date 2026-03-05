export type { Magazine, DataSource, MagazineSlot, MagazineVoiceConfig } from './types';
export {
  listMagazines,
  getMagazine,
  createMagazine,
  updateMagazine,
  deleteMagazine,
  addDataSource,
  removeDataSource,
  loadMagazine,
  unloadMagazine,
  getActiveMagazines,
} from './client';
