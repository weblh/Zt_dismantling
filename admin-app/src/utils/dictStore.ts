import {
  getLocalBizRows,
  addLocalBizRow,
  updateLocalBizRow,
  deleteLocalBizRows,
  formatBizDateTime,
  setLocalBizRows,
} from './localBizStore';
import { getStoredUser } from '@/config/apps';
import { listPayees, type PayeeRecord } from './payeeStore';
import { listSuppliers, createSupplier, updateSupplier, removeSuppliers, type SupplierRecord } from './supplierStore';

export type DictKey = 'supplier' | 'payee' | 'salesman' | 'vehicleModel' | 'warehouse' | 'productName' | 'staff';

export interface DictOption {
  value: string;
  label: string;
  raw?: Record<string, unknown>;
}

function meta() {
  const user = getStoredUser();
  const now = formatBizDateTime();
  return {
    submitter: user.nickname || user.username || '系统',
    submitTime: now,
    updateTime: now,
  };
}

function ensureSeed<T extends { id: number }>(bizKey: string, seed: T[]) {
  if (getLocalBizRows<T>(bizKey).length === 0 && seed.length > 0) {
    setLocalBizRows(bizKey, seed);
  }
}

/** ---------- 业务员 ---------- */
export interface SalesmanRecord {
  id: number;
  key: string;
  salesman: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const SALESMAN_KEY = 'salesman';
const SALESMAN_SEED: SalesmanRecord[] = [
  { id: 1, key: '1', salesman: '张经理', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 2, key: '2', salesman: '王经理', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 3, key: '3', salesman: '赵经理', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 4, key: '4', salesman: '孙经理', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
];

export function listSalesmen(): SalesmanRecord[] {
  ensureSeed(SALESMAN_KEY, SALESMAN_SEED);
  return getLocalBizRows<SalesmanRecord>(SALESMAN_KEY);
}

export function createSalesman(salesman: string) {
  const id = Date.now();
  return addLocalBizRow<SalesmanRecord>(SALESMAN_KEY, { key: String(id), salesman, ...meta() });
}

export function updateSalesman(id: number, salesman: string) {
  return updateLocalBizRow<SalesmanRecord>(SALESMAN_KEY, id, { salesman, updateTime: formatBizDateTime() });
}

export function removeSalesmen(ids: number[]) {
  deleteLocalBizRows(SALESMAN_KEY, ids);
}

/** ---------- 车辆型号 ---------- */
export interface VehicleModelRecord {
  id: number;
  key: string;
  vehicleModel: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const VEHICLE_MODEL_KEY = 'vehicle-model';
const VEHICLE_MODEL_SEED: VehicleModelRecord[] = [
  '星马', '程力', '德龙', '开瑞', '五菱', '长城', '大众', '奥迪', '比亚迪', '长安',
].map((name, i) => ({
  id: i + 1,
  key: String(i + 1),
  vehicleModel: name,
  submitter: '系统',
  submitTime: '2026-01-01 00:00:00',
  updateTime: '2026-01-01 00:00:00',
}));

export function listVehicleModels(): VehicleModelRecord[] {
  ensureSeed(VEHICLE_MODEL_KEY, VEHICLE_MODEL_SEED);
  return getLocalBizRows<VehicleModelRecord>(VEHICLE_MODEL_KEY);
}

export function createVehicleModel(vehicleModel: string) {
  const id = Date.now();
  return addLocalBizRow<VehicleModelRecord>(VEHICLE_MODEL_KEY, { key: String(id), vehicleModel, ...meta() });
}

export function updateVehicleModel(id: number, vehicleModel: string) {
  return updateLocalBizRow<VehicleModelRecord>(VEHICLE_MODEL_KEY, id, {
    vehicleModel,
    updateTime: formatBizDateTime(),
  });
}

export function removeVehicleModels(ids: number[]) {
  deleteLocalBizRows(VEHICLE_MODEL_KEY, ids);
}

/** ---------- 仓库 ---------- */
export interface WarehouseRecord {
  id: number;
  key: string;
  warehouseName: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const WAREHOUSE_KEY = 'warehouse';
const WAREHOUSE_SEED: WarehouseRecord[] = [
  { id: 1, key: '1', warehouseName: '一号库', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 2, key: '2', warehouseName: '二号库', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 3, key: '3', warehouseName: '成品库', submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
];

export function listWarehouses(): WarehouseRecord[] {
  ensureSeed(WAREHOUSE_KEY, WAREHOUSE_SEED);
  return getLocalBizRows<WarehouseRecord>(WAREHOUSE_KEY);
}

export function createWarehouse(warehouseName: string) {
  const id = Date.now();
  return addLocalBizRow<WarehouseRecord>(WAREHOUSE_KEY, { key: String(id), warehouseName, ...meta() });
}

export function updateWarehouse(id: number, warehouseName: string) {
  return updateLocalBizRow<WarehouseRecord>(WAREHOUSE_KEY, id, {
    warehouseName,
    updateTime: formatBizDateTime(),
  });
}

export function removeWarehouses(ids: number[]) {
  deleteLocalBizRows(WAREHOUSE_KEY, ids);
}

/** ---------- 产品名称 ---------- */
export interface ProductNameRecord {
  id: number;
  key: string;
  productName: string;
  proportion: number;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const PRODUCT_NAME_KEY = 'product-name';
const PRODUCT_NAME_SEED: ProductNameRecord[] = [
  { id: 1, key: '1', productName: '废钢', proportion: 0.1456, submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 2, key: '2', productName: '撕碎料', proportion: 0.4516, submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 3, key: '3', productName: '铝件', proportion: 0.0204, submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 4, key: '4', productName: '铜线', proportion: 0.0098, submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
  { id: 5, key: '5', productName: '塑料', proportion: 0.0356, submitter: '系统', submitTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00' },
];

export function listProductNames(): ProductNameRecord[] {
  ensureSeed(PRODUCT_NAME_KEY, PRODUCT_NAME_SEED);
  return getLocalBizRows<ProductNameRecord>(PRODUCT_NAME_KEY);
}

export function createProductName(input: { productName: string; proportion?: number }) {
  const id = Date.now();
  return addLocalBizRow<ProductNameRecord>(PRODUCT_NAME_KEY, {
    key: String(id),
    productName: input.productName,
    proportion: input.proportion ?? 0,
    ...meta(),
  });
}

export function updateProductName(id: number, patch: Partial<ProductNameRecord>) {
  return updateLocalBizRow<ProductNameRecord>(PRODUCT_NAME_KEY, id, {
    ...patch,
    updateTime: formatBizDateTime(),
  });
}

export function removeProductNames(ids: number[]) {
  deleteLocalBizRows(PRODUCT_NAME_KEY, ids);
}

/** ---------- 生产人员（司磅员/拆解员/查验员） ---------- */
export interface StaffRecord {
  id: number;
  key: string;
  staffName: string;
  roleType: string;
  submitter: string;
  submitTime: string;
  updateTime: string;
}

const STAFF_KEY = 'staff';
const STAFF_SEED: StaffRecord[] = [
  '齐志江', '翟鑫鑫', '王瑞', '樊志强', '张绒斌', '李闯闯', '张鹤鸣', '范亚飞',
].map((name, i) => ({
  id: i + 1,
  key: String(i + 1),
  staffName: name,
  roleType: i < 2 ? '司磅员' : '拆解员',
  submitter: '系统',
  submitTime: '2026-01-01 00:00:00',
  updateTime: '2026-01-01 00:00:00',
}));

export function listStaff(): StaffRecord[] {
  ensureSeed(STAFF_KEY, STAFF_SEED);
  return getLocalBizRows<StaffRecord>(STAFF_KEY);
}

export function createStaff(input: { staffName: string; roleType?: string }) {
  const id = Date.now();
  return addLocalBizRow<StaffRecord>(STAFF_KEY, {
    key: String(id),
    staffName: input.staffName,
    roleType: input.roleType || '生产人员',
    ...meta(),
  });
}

export function updateStaff(id: number, patch: Partial<Pick<StaffRecord, 'staffName' | 'roleType'>>) {
  return updateLocalBizRow<StaffRecord>(STAFF_KEY, id, {
    ...patch,
    updateTime: formatBizDateTime(),
  });
}

export function removeStaff(ids: number[]) {
  deleteLocalBizRows(STAFF_KEY, ids);
}

/** 统一下拉选项：基础资料列表作为字典 */
export function getDictOptions(key: DictKey): DictOption[] {
  switch (key) {
    case 'supplier':
      return listSuppliers().map((r) => ({
        value: r.supplierName,
        label: r.supplierName,
        raw: r as unknown as Record<string, unknown>,
      }));
    case 'payee':
      return listPayees().map((r: PayeeRecord) => {
        const account = (r.payeeAccount || '').trim();
        const bank = r.openingBank || '未填开户行';
        return {
          value: account ? `${r.payeeUnit}|${account}` : r.payeeUnit,
          label: account
            ? `${r.payeeUnit} · ${account}（${bank}）`
            : `${r.payeeUnit}（${bank}）`,
          raw: r as unknown as Record<string, unknown>,
        };
      });
    case 'salesman':
      return listSalesmen().map((r) => ({
        value: r.salesman,
        label: r.salesman,
        raw: r as unknown as Record<string, unknown>,
      }));
    case 'vehicleModel':
      return listVehicleModels().map((r) => ({
        value: r.vehicleModel,
        label: r.vehicleModel,
        raw: r as unknown as Record<string, unknown>,
      }));
    case 'warehouse':
      return listWarehouses().map((r) => ({
        value: r.warehouseName,
        label: r.warehouseName,
        raw: r as unknown as Record<string, unknown>,
      }));
    case 'productName':
      return listProductNames().map((r) => ({
        value: r.productName,
        label: r.productName,
        raw: r as unknown as Record<string, unknown>,
      }));
    case 'staff':
      return listStaff().map((r) => ({
        value: r.staffName,
        label: `${r.staffName}（${r.roleType || '生产'}）`,
        raw: r as unknown as Record<string, unknown>,
      }));
    default:
      return [];
  }
}

export { listSuppliers, createSupplier, updateSupplier, removeSuppliers, listPayees };
export type { SupplierRecord, PayeeRecord };
