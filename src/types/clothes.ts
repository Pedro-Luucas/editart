export type ClothingType = 
  | 'with_collar' 
  | 'without_collar' 
  | 'thick_cap' 
  | 'simple_cap' 
  | 'reflectors' 
  | 'uniform' 
  | 'custom';

export type ServiceType = 'stamping' | 'embroidery' | 'transfer';

export type ServiceLocation = 
  | 'front_right' 
  | 'front_left' 
  | 'back' 
  | 'sleeve_left' 
  | 'sleeve_right';

export type ClothingSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type SizesMap = Record<ClothingSize, number>;

export interface ClothingService {
  id: string;
  clothes_id: string;
  service_type: ServiceType;
  location: ServiceLocation;
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
  unit_price?: number;
}

// Labels for UI
export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  with_collar: 'Com Gola',
  without_collar: 'Sem Gola',
  thick_cap: 'Boné Grosso',
  simple_cap: 'Boné Simples',
  reflectors: 'Refletores',
  uniform: 'Fardamento',
  custom: 'Personalizado'
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  stamping: 'Estampagem',
  embroidery: 'Bordado',
  transfer: 'Transfer'
};

export const SERVICE_LOCATION_LABELS: Record<ServiceLocation, string> = {
  front_right: 'Frente Direita',
  front_left: 'Frente Esquerda',
  back: 'Atrás',
  sleeve_left: 'Manga Esquerda',
  sleeve_right: 'Manga Direita'
};

export const CLOTHING_SIZES: ClothingSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
