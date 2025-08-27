export type ClothingType = 
  | 'collared_tshirts'
  | 'tshirts_without_collar'
  | 'uniform_shirts'
  | 'uniforms'
  | 'uniform_pants'
  | 'bags'
  | 'aprons'
  | 'cloth_vests'
  | 'reflective_vests'
  | 'thick_caps'
  | 'simple_caps'
  | 'towels'
  | 'sheets'
  | 'aprons_kitchen'
  | 'other';

export type ServiceType = 'embroidery' | 'stamping' | 'dtf' | 'transfer';

export type ServiceLocation = 
  | 'front_right'
  | 'front_left'
  | 'back'
  | 'sleeve_left'
  | 'sleeve_right'
  | 'center_front'
  | 'center_back'
  | 'left_side'
  | 'right_side'
  | 'top'
  | 'bottom'
  | 'custom';

export type ClothingSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type SizesMap = Record<ClothingSize, number>;

export interface ClothingService {
  id: string;
  clothes_id: string;
  service_type: ServiceType;
  location: ServiceLocation;
  description?: string;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface Clothes {
  id: string;
  order_id: string;
  clothing_type: ClothingType;
  custom_type?: string;
  unit_price: number;
  sizes: SizesMap;
  color: string;
  total_quantity: number;
  services: ClothingService[];
  created_at: string;
  updated_at: string;
}

export interface CreateClothingService {
  service_type: ServiceType;
  location: ServiceLocation;
  description?: string;
  unit_price: number;
}

export interface CreateClothes {
  order_id: string;
  clothing_type: ClothingType;
  custom_type?: string;
  unit_price: number;
  sizes: SizesMap;
  color: string;
  services: CreateClothingService[];
}

export interface UpdateClothes {
  clothing_type?: ClothingType;
  custom_type?: string | null;
  unit_price?: number;
  sizes?: SizesMap;
  color?: string;
}

export interface UpdateClothingService {
  service_type?: ServiceType;
  location?: ServiceLocation;
  description?: string | null;
  unit_price?: number;
}

// Labels for UI
export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  collared_tshirts: 'Camisetes de Gola',
  tshirts_without_collar: 'Camisetes sem Gola',
  uniform_shirts: 'Camisas de Uniformes',
  uniforms: 'Fardamentos',
  uniform_pants: 'Calças de Fardamentos',
  bags: 'Bolços',
  aprons: 'Batas',
  cloth_vests: 'Coletes de Pano',
  reflective_vests: 'Coletes Refletore',
  thick_caps: 'Bones Grossos',
  simple_caps: 'Bones Simples',
  towels: 'Toalhas',
  sheets: 'Lençois',
  aprons_kitchen: 'Aventais',
  other: 'Outros (especificar)'
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  embroidery: 'Bordado',
  stamping: 'Estampagem',
  dtf: 'DTF',
  transfer: 'Transfer'
};

export const SERVICE_LOCATION_LABELS: Record<ServiceLocation, string> = {
  front_right: 'Frente Direita',
  front_left: 'Frente Esquerda',
  back: 'Atrás',
  sleeve_left: 'Manga Esquerda',
  sleeve_right: 'Manga Direita',
  center_front: 'Centro Frente',
  center_back: 'Centro Atrás',
  left_side: 'Lado Esquerdo',
  right_side: 'Lado Direito',
  top: 'Topo',
  bottom: 'Base',
  custom: 'Personalizado'
};

export const CLOTHING_SIZES: ClothingSize[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
