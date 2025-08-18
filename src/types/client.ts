export interface Client {
  id: string;
  name: string;
  nuit: string;
  contact: string;
  category: string;
  requisition: string;
  observations: string;
  created_at: string; // TIMESTAMPTZ como string
  updated_at: string; // TIMESTAMPTZ como string
}

export interface CreateClientDto {
  name: string;
  nuit: string;
  contact: string;
  category: string;
  requisition: string;
  observations: string;
}

export interface UpdateClientDto {
  name?: string;
  nuit?: string;
  contact?: string;
  category?: string;
  requisition?: string;
  observations?: string;
}
