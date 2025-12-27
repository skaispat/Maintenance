// Extended model with camelCase properties to match component expectations
export interface MachineDetails {
  id: number;
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  department: string;
  location?: string;
  status: string;
  purchaseDate: string;
  purchasePrice?: number;
  vendor?: string;
  warrantyExpiration?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceSchedule: string[];
  maintenanceParts?: string[];
  totalRepairCost: number;
  repairCount: number;
  healthScore: number;
  specifications?: Record<string, string>;
  temperatureData: any[];
  repairHistory: RepairHistoryItem[];
  documents: DocumentItem[];
  maintenanceTasks: MaintenanceTask[];
  yearlyRepairCosts: YearlyRepairCost[];
  storePurchases: StorePurchase[];
  fixedAssets: FixedAsset[];
  itemUsageHistory: ItemUsageHistory[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RepairHistoryItem {
  id: number;
  date: string;
  description: string;
  cost: number;
  technician: string;
  status: 'completed' | 'in-progress' | 'cancelled';
  parts?: string[];
}

export interface DocumentItem {
  id: number;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface MaintenanceTask {
  id: number;
  title: string;
  type: string;
  dueDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
}

export interface YearlyRepairCost {
  year: number;
  cost: number;
  // Add any other properties if needed
}

export interface FixedAsset {
  id: number;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  tag?: string;
  depreciation?: number;
  location?: string; // Added based on usage in AddAssetsModal
  status?: string;   // Added based on usage in AddAssetsModal
}

export interface PurchaseItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StorePurchase {
  id: number;
  purchaseOrder: string;
  date: string;
  vendor: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: string;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  purchaseDate?: string;
  supplier?: string;
}

export interface ItemUsageHistory {
  id: number;
  date: string;
  hoursUsed: number;
  operator: string;
  name?: string;
  category?: string;
  currentStock?: number;
  totalPurchased?: number;
  lastUsed?: string;
  avgLifespan?: string;
  totalCost?: number;
}

export interface RepairRecord {
  id: number;
  date: string;
  type: string;
  issue: string;
  technician: string;
  cost: number;
  parts: string[];
  resolution: string;
  storeItems: any[];
}

export interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
}