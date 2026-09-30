import { csvText } from './csv.ts';
export function inventoryFixture() {
  const rows = [];
  for (let i = 1; i <= 500; i++) {
    const n = ((i - 1) % 450) + 1;
    rows.push([n % 2 ? ` sku-${String(n).padStart(4,'0')} ` : `SKU-${String(n).padStart(4,'0')}`, n % 37 === 0 ? '' : `  Product   ${n}  `, n % 29 === 0 ? '12x.99' : `$${(5 + n / 10).toFixed(2)}`, n % 3 ? ' ELECTRONICS ' : ' home ']);
  }
  return csvText(['sku','name','price','category'],rows);
}