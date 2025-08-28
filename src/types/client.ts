export interface Client {
  id: string;
  name: string;
  nuit: string;
  contact: string;
  category: string;
  observations: string;
  debt: number;
  created_at: string; // TIMESTAMPTZ como string
  updated_at: string; // TIMESTAMPTZ como string
}

export interface CreateClientDto {
  name: string;
  nuit: string;
  contact: string;
  category: string;
  observations: string;
}

export interface UpdateClientDto {
  name?: string;
  nuit?: string;
  contact?: string;
  category?: string;
  observations?: string;
}
