export type ImpressionMaterial = 
  | 'vinyl_white'
  | 'vinyl_transparent'
  | 'vinyl_perforated'
  | 'vinyl_cut'
  | 'banner_black_white'
  | 'backlite'
  | 'flag_fabric'
  | 'other';

export interface Impression {
  id: string;
  order_id: string;
  name: string;
  size: string;
  material: ImpressionMaterial;
  custom_material?: string;
  description: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateImpression {
  order_id: string;
  name: string;
  size: string;
  material: ImpressionMaterial;
  custom_material?: string;
  description: string;
  price: number;
}

export interface UpdateImpression {
  name?: string;
  size?: string;
  material?: ImpressionMaterial;
  custom_material?: string;
  description?: string;
  price?: number;
}

// Labels for UI
export const IMPRESSION_MATERIAL_LABELS: Record<ImpressionMaterial, string> = {
  vinyl_white: 'Vinil Branco',
  vinyl_transparent: 'Vinil Transparente',
  vinyl_perforated: 'Vinil Perfurado',
  vinyl_cut: 'Vinil de Corte',
  banner_black_white: 'Banner Preto e Branco',
  backlite: 'Backlite',
  flag_fabric: 'Tecido de Bandeira',
  other: 'Outros (especificar)'
};

export const IMPRESSION_MATERIALS: ImpressionMaterial[] = [
  'vinyl_white',
  'vinyl_transparent',
  'vinyl_perforated',
  'vinyl_cut',
  'banner_black_white',
  'backlite',
  'flag_fabric',
  'other'
];
