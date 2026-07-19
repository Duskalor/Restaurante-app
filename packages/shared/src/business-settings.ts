import type { IsoDateString } from './common.js';

// GET /business-settings/:branchId, POST /business-settings, POST /business-settings/logo
// — apps/backend/src/services/business-settings.service.ts

export interface BusinessSetting {
  id: string;
  branchId: string;
  businessName: string;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface UpsertBusinessSettingRequest {
  branchId: string;
  businessName: string;
  ruc?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface UploadLogoResponse {
  message: string;
  fileUrl: string;
}
