import * as XLSX from 'xlsx';

export type ProductKind = 'sellable' | 'production_input';

export type StoreCategoryLite = { id: number; name: string };

export type BulkProductRow = {
  key: string;
  name: string;
  category_id: number | null;
  pending_category_name: string;
  quantity: string;
  costPrice: string;
  price: string;
  taxes: string;
  product_kind: ProductKind;
  is_pack: boolean;
  quantity_per_pack: string;
  cost_price_per_pack: string;
  pack_sell_price: string;
  allow_variable_price: boolean;
  variable_price_min: string;
  variable_price_max: string;
};

export type BulkOnboardApiRow = {
  name: string | null;
  category_id: number | null;
  quantity: number;
  costPrice: number | null;
  price: number;
  taxes: number;
  product_kind: ProductKind;
  is_pack: boolean;
  quantity_per_pack: number | null;
  cost_price_per_pack: number | null;
  pack_sell_price: number | null;
  allow_variable_price: boolean;
  variable_price_min: number | null;
  variable_price_max: number | null;
};

export function createEmptyRow(): BulkProductRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    name: '',
    category_id: null,
    pending_category_name: '',
    quantity: '1',
    costPrice: '',
    price: '',
    taxes: '0',
    product_kind: 'sellable',
    is_pack: false,
    quantity_per_pack: '',
    cost_price_per_pack: '',
    pack_sell_price: '',
    allow_variable_price: false,
    variable_price_min: '',
    variable_price_max: '',
  };
}

function normKey(s: string | undefined | null): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= n; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j] + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export function matchCategoryFromList(
  rawName: string,
  categories: StoreCategoryLite[] | undefined
): StoreCategoryLite | null {
  const list = categories || [];
  const needle = normKey(rawName);
  if (!needle) return null;

  const MIN_SCORE = 0.82;
  let best: StoreCategoryLite | null = null;
  let bestScore = 0;

  for (let i = 0; i < list.length; i += 1) {
    const c = list[i]!;
    const hay = normKey(c.name);
    if (hay) {
      let score = 0;
      const shorter = needle.length <= hay.length ? needle : hay;
      const longer = needle.length <= hay.length ? hay : needle;
      if (shorter.length >= 4 && longer.includes(shorter)) {
        score = 0.88 + 0.1 * (shorter.length / longer.length);
        if (score > 0.98) score = 0.98;
      } else {
        const d = levenshtein(needle, hay);
        const maxLen = Math.max(needle.length, hay.length) || 1;
        score = 1 - d / maxLen;
      }

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }

  if (bestScore >= MIN_SCORE) return best;
  return null;
}

function pick(record: Record<string, unknown>, ...candidates: string[]): string {
  const keyMap = Object.fromEntries(Object.keys(record).map((k) => [normKey(k), k]));
  for (const cand of candidates) {
    const origKey = keyMap[normKey(cand)];
    if (!origKey) continue;
    const v = record[origKey];
    if (v === '' || v == null) continue;
    return String(v).trim();
  }
  return '';
}

function parseBool(v: string | undefined): boolean {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y' || s === 'on';
}

const POSITIONAL_KEYS = [
  'Name',
  'Category',
  'Qty',
  'Cost Price',
  'Selling Price',
  'Is Pack',
  'Qty per Pack',
  'Cost per Pack',
  'Pack Sell Price',
] as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((c) => c.replace(/^"|"$/g, ''));
}

function looksLikeHeaderRow(cells: string[]): boolean {
  const n0 = normKey(cells[0] || '');
  if (['name', 'product name', 'item', 'title', 'product'].includes(n0)) return true;
  return cells.some((c) => {
    const n = normKey(c || '');
    return ['category', 'quantity', 'qty', 'price', 'selling price', 'cost'].includes(n);
  });
}

function linesToPositionalRecords(lines: string[]): Record<string, string>[] {
  return lines
    .map((line) => parseCsvLine(line))
    .filter((cols) => {
      const firstCol = (cols[0] || '').toLowerCase();
      const isHeader =
        firstCol === 'name' || firstCol === 'product name' || firstCol === 'item';
      return !isHeader && Boolean(cols[0]);
    })
    .map((cols) =>
      POSITIONAL_KEYS.reduce<Record<string, string>>((acc, key, i) => {
        acc[key] = cols[i] ?? '';
        return acc;
      }, {})
    );
}

export function mapRecordToBulkRow(
  record: Record<string, unknown>,
  categories: StoreCategoryLite[] | undefined
): BulkProductRow | null {
  const list = categories || [];

  const name = pick(record, 'name', 'product name', 'product', 'item', 'title');
  if (!name) return null;

  const categoryStr = pick(record, 'category', 'category name', 'cat');
  let category_id: number | null = null;
  let pending_category_name = '';
  if (categoryStr.trim()) {
    const exact = list.find((c) => normKey(c.name) === normKey(categoryStr));
    if (exact) {
      category_id = exact.id;
    } else {
      const near = matchCategoryFromList(categoryStr, list);
      if (near) {
        category_id = near.id;
      } else {
        pending_category_name = categoryStr.trim();
      }
    }
  }

  const qPerPack = pick(
    record,
    'qty per pack',
    'units per pack',
    'quantity per pack',
    'pack size',
    'units in pack'
  );
  const costPerPack = pick(record, 'cost per pack', 'pack cost', 'purchase cost per pack');
  const packSellPrice = pick(
    record,
    'pack sell price',
    'pack selling price',
    'optional pack price',
    'whole pack price',
    'pack sale price'
  );

  let isPack = parseBool(pick(record, 'is pack', 'pack', 'pack product', 'packed'));
  if (!isPack && qPerPack && Number(qPerPack) > 0 && costPerPack !== '' && Number(costPerPack) >= 0) {
    isPack = true;
  }

  const allowVar = parseBool(
    pick(record, 'variable price', 'allow variable', 'variable', 'variable pricing')
  );
  const vmin = pick(record, 'min price', 'variable min', 'price min', 'min');
  const vmax = pick(record, 'max price', 'variable max', 'price max', 'max');

  const prodInput = parseBool(
    pick(record, 'input only', 'production input', 'raw material', 'not sold', 'ingredient')
  );

  const quantity =
    pick(record, 'quantity', 'qty', 'stock', 'number of packs', 'pack count', 'packs') || '1';

  const costUnit = pick(record, 'unit cost', 'cost', 'cost price', 'purchase cost');
  const selling =
    pick(record, 'selling price', 'sale price', 'selling', 'retail price') ||
    pick(record, 'price', 'amount');

  const taxes = pick(record, 'tax', 'taxes', 'tax %', 'vat') || '0';

  return {
    ...createEmptyRow(),
    name,
    category_id,
    pending_category_name,
    quantity,
    costPrice: costUnit,
    price: selling,
    taxes,
    product_kind: prodInput ? 'production_input' : 'sellable',
    is_pack: isPack && !prodInput,
    quantity_per_pack: qPerPack,
    cost_price_per_pack: costPerPack,
    pack_sell_price: packSellPrice,
    allow_variable_price: allowVar && !prodInput,
    variable_price_min: vmin,
    variable_price_max: vmax,
  };
}

export function parsePositionalPasteText(
  text: string,
  categories: StoreCategoryLite[] | undefined
): BulkProductRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const records = linesToPositionalRecords(lines);
  return records.map((r) => mapRecordToBulkRow(r, categories)).filter((row): row is BulkProductRow => row != null);
}

function csvTextToRecordObjects(text: string): Record<string, unknown>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const firstCells = parseCsvLine(lines[0]!);
  if (looksLikeHeaderRow(firstCells)) {
    const headers = firstCells;
    return lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      return headers.reduce<Record<string, unknown>>((acc, h, i) => {
        acc[String(h).trim()] = cols[i] ?? '';
        return acc;
      }, {});
    });
  }
  return linesToPositionalRecords(lines);
}

export async function parseBulkUploadFile(
  file: File,
  categories: StoreCategoryLite[] | undefined
): Promise<BulkProductRow[]> {
  const lower = (file.name || '').toLowerCase();
  let records: Record<string, unknown>[] = [];

  if (lower.endsWith('.csv')) {
    const text = await file.text();
    records = csvTextToRecordObjects(text);
  } else {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    if (!wb.SheetNames.length) return [];
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Record<
      string,
      unknown
    >[];
  }

  return records
    .map((rec) => mapRecordToBulkRow(rec, categories))
    .filter((row): row is BulkProductRow => Boolean(row?.name));
}

export function rowQualifiesForBulkSubmit(row: BulkProductRow): boolean {
  if (!row.name?.trim()) return false;
  const kind = row.product_kind || 'sellable';
  if (kind === 'production_input') {
    return row.costPrice !== '' && Number(row.costPrice) >= 0;
  }
  const hasSelling = row.price !== '' && Number(row.price) >= 1;
  const hasVarRange =
    row.allow_variable_price &&
    row.variable_price_min !== '' &&
    row.variable_price_max !== '' &&
    Number(row.variable_price_max) >= 1;
  return hasSelling || hasVarRange;
}

function formatRowForBulkApi(row: BulkProductRow): BulkOnboardApiRow {
  const kind = row.product_kind || 'sellable';
  const isPack = Boolean(row.is_pack) && kind === 'sellable';
  const isVar = Boolean(row.allow_variable_price) && kind === 'sellable';

  let costPrice: number | null = row.costPrice === '' ? null : Number(row.costPrice);
  if (isPack && row.cost_price_per_pack !== '' && row.quantity_per_pack !== '') {
    const cpp = Number(row.cost_price_per_pack);
    const qpp = Number(row.quantity_per_pack);
    if (Number.isFinite(cpp) && Number.isFinite(qpp) && qpp > 0) {
      costPrice = cpp / qpp;
    }
  }

  let price = row.price === '' ? 0 : Number(row.price);
  if (isVar) {
    const vmin = row.variable_price_min === '' ? null : Number(row.variable_price_min);
    const vmax = row.variable_price_max === '' ? null : Number(row.variable_price_max);
    if ((!price || price < 1) && vmin != null && vmax != null && vmax >= 1) {
      price = vmax;
    }
  }

  return {
    name: row.name || null,
    category_id: row.category_id || null,
    quantity: Number(row.quantity || 1),
    costPrice,
    price,
    taxes: row.taxes === '' ? 0 : Number(row.taxes),
    product_kind: kind,
    is_pack: isPack,
    quantity_per_pack: row.quantity_per_pack === '' ? null : Number(row.quantity_per_pack),
    cost_price_per_pack:
      row.cost_price_per_pack === '' ? null : Number(row.cost_price_per_pack),
    pack_sell_price: row.pack_sell_price === '' ? null : Number(row.pack_sell_price),
    allow_variable_price: isVar,
    variable_price_min: row.variable_price_min === '' ? null : Number(row.variable_price_min),
    variable_price_max: row.variable_price_max === '' ? null : Number(row.variable_price_max),
  };
}

export function buildBulkSubmitPackage(rows: BulkProductRow[]): {
  apiRows: BulkOnboardApiRow[];
  sourceRowKeys: string[];
} {
  const sourceRowKeys: string[] = [];
  const apiRows: BulkOnboardApiRow[] = [];
  rows.forEach((row) => {
    if (!rowQualifiesForBulkSubmit(row)) return;
    sourceRowKeys.push(row.key);
    apiRows.push(formatRowForBulkApi(row));
  });
  return { apiRows, sourceRowKeys };
}
