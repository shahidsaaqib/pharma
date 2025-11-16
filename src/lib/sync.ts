/* ==== SUPABASE SYNC SERVICE ==== */

import { supabase } from '@/integrations/supabase/client';
import {
  medicineStorage,
  salesStorage,
  refundsStorage,
  expensesStorage,
  queueStorage,
  offlineStorage,
  authStorage,
  type Medicine,
  type Sale,
  type Refund,
  type Expense,
  type QueuedAction,
} from './storage';

// Audit log interface
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: 'medicine' | 'sale' | 'refund' | 'expense';
  entityId: string;
  details: string;
  timestamp: string;
}

// Store audit logs in localStorage
const AUDIT_LOG_KEY = 'medical_pos_audit_logs';

export const auditLogStorage = {
  getAll: (): AuditLog[] => {
    try {
      const logs = localStorage.getItem(AUDIT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  },
  
  add: (log: AuditLog): void => {
    try {
      const logs = auditLogStorage.getAll();
      logs.push(log);
      // Keep only last 1000 logs to prevent storage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  },

  clear: (): void => {
    localStorage.removeItem(AUDIT_LOG_KEY);
  },
};

// Create audit log
export const createAuditLog = (
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: string
) => {
  const user = JSON.parse(localStorage.getItem('medical_pos_current_user') || '{}');
  
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId: user.id || 'unknown',
    username: user.username || 'System',
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };

  auditLogStorage.add(log);
};

// Sync service
export const syncService = {
  // Check if Supabase is properly configured
  isSupabaseConfigured: (): boolean => {
    // Check if we have a valid user session
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser) return false;

    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    return url.includes('supabase.co') && !key.includes('placeholder');
  },

  // Get current user ID for syncing
  async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
    
    // Fallback to local user
    const localUser = authStorage.getCurrentUser();
    return localUser?.id || null;
  },

  // Map local Medicine to Supabase format
  mapMedicineToSupabase(medicine: Medicine, userId: string) {
    return {
      id: medicine.id,
      name: medicine.name,
      type: medicine.type as any,
      strength: medicine.strength || null,
      quantity: medicine.quantity,
      cost_price: medicine.costPrice,
      sale_price: medicine.salePrice,
      expiry: medicine.expiry || null,
      reorder_level: medicine.reorderLevel,
      created_at: medicine.createdAt,
      updated_at: medicine.updatedAt,
      user_id: userId,
    };
  },

  // Map Supabase Medicine to local format
  mapMedicineFromSupabase(medicine: any): Medicine {
    return {
      id: medicine.id,
      name: medicine.name,
      type: medicine.type,
      strength: medicine.strength || '',
      quantity: medicine.quantity,
      costPrice: medicine.cost_price,
      salePrice: medicine.sale_price,
      expiry: medicine.expiry || '',
      reorderLevel: medicine.reorder_level,
      createdAt: medicine.created_at,
      updatedAt: medicine.updated_at,
    };
  },

  // Sync medicines to Supabase
  syncMedicines: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const userId = await syncService.getUserId();
    if (!userId) return;

    const medicines = medicineStorage.getAll();
    const mapped = medicines.map(m => syncService.mapMedicineToSupabase(m, userId));
    const { error } = await supabase.from('medicines').upsert(mapped);
    
    if (error) {
      console.error('Error syncing medicines:', error);
      throw error;
    }
  },

  // Sync sales to Supabase
  syncSales: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const userId = await syncService.getUserId();
    if (!userId) return;

    const sales = salesStorage.getAll();
    // Note: Supabase has a different structure with separate sale_items table
    // For now, skip syncing sales due to schema mismatch
    console.log('Sales sync: Skipped due to schema differences');
  },

  // Sync refunds to Supabase
  syncRefunds: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const userId = await syncService.getUserId();
    if (!userId) return;

    const refunds = refundsStorage.getAll();
    // Note: Supabase has a different structure with separate refund_items table
    // For now, skip syncing refunds due to schema mismatch
    console.log('Refunds sync: Skipped due to schema differences');
  },

  // Map local Expense to Supabase format
  mapExpenseToSupabase(expense: Expense, userId: string) {
    return {
      id: expense.id,
      expense_date: expense.date,
      type: expense.type as any,
      amount: expense.amount,
      note: expense.note || null,
      created_at: expense.createdAt,
      user_id: userId,
      synced: true,
    };
  },

  // Map Supabase Expense to local format
  mapExpenseFromSupabase(expense: any): Expense {
    return {
      id: expense.id,
      date: expense.expense_date,
      type: expense.type,
      amount: expense.amount,
      note: expense.note || '',
      createdAt: expense.created_at,
    };
  },

  // Sync expenses to Supabase
  syncExpenses: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const userId = await syncService.getUserId();
    if (!userId) return;

    const expenses = expensesStorage.getAll();
    const mapped = expenses.map(e => syncService.mapExpenseToSupabase(e, userId));
    const { error } = await supabase.from('expenses').upsert(mapped);
    
    if (error) {
      console.error('Error syncing expenses:', error);
      throw error;
    }
  },

  // Process queued actions
  processQueue: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const queue = queueStorage.getAll();
    
    for (const action of queue) {
      try {
        await syncService.processQueuedAction(action);
        queueStorage.remove(action.id);
      } catch (error) {
        console.error('Error processing queued action:', error);
      }
    }
  },

  // Process individual queued action
  processQueuedAction: async (action: QueuedAction): Promise<void> => {
    const table = action.type === 'medicine' ? 'medicines' :
                  action.type === 'sale' ? 'sales' :
                  action.type === 'refund' ? 'refunds' : 'expenses';

    if (action.action === 'create') {
      await supabase.from(table).insert(action.data);
    } else if (action.action === 'update') {
      await supabase.from(table).update(action.data).eq('id', action.data.id);
    } else if (action.action === 'delete') {
      await supabase.from(table).delete().eq('id', action.data.id);
    }
  },

  // Full sync - pull from Supabase and merge with local
  fullSync: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    try {
      const userId = await syncService.getUserId();
      if (!userId) return;

      // Fetch from Supabase
      const [medicinesResult, expensesResult] = await Promise.all([
        supabase.from('medicines').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId),
      ]);

      // Merge medicines with local data
      if (medicinesResult.data) {
        const localMedicines = medicineStorage.getAll();
        const remoteMedicines = medicinesResult.data.map(syncService.mapMedicineFromSupabase);
        const merged = syncService.mergeData(localMedicines, remoteMedicines);
        medicineStorage.save(merged);
      }

      // Merge expenses with local data
      if (expensesResult.data) {
        const localExpenses = expensesStorage.getAll();
        const remoteExpenses = expensesResult.data.map(syncService.mapExpenseFromSupabase);
        const merged = syncService.mergeData(localExpenses, remoteExpenses);
        expensesStorage.save(merged);
      }

      // Sync local changes to Supabase
      await syncService.syncMedicines();
      await syncService.syncExpenses();

      // Process any queued actions
      await syncService.processQueue();

      offlineStorage.setOffline(false);
    } catch (error) {
      console.error('Full sync failed:', error);
      offlineStorage.setOffline(true);
      throw error;
    }
  },

  // Merge local and remote data
  mergeData: <T extends { id: string; updatedAt?: string; createdAt: string }>(
    local: T[],
    remote: T[]
  ): T[] => {
    const merged = new Map<string, T>();

    // Add all remote items
    remote.forEach(item => merged.set(item.id, item));

    // Add local items that are newer or don't exist remotely
    local.forEach(item => {
      const remoteItem = merged.get(item.id);
      if (!remoteItem) {
        merged.set(item.id, item);
      } else if (item.updatedAt && remoteItem.updatedAt) {
        if (new Date(item.updatedAt) > new Date(remoteItem.updatedAt)) {
          merged.set(item.id, item);
        }
      }
    });

    return Array.from(merged.values());
  },
};

/* ==== END OF SUPABASE SYNC SERVICE ==== */
