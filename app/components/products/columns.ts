import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle } from 'lucide-vue-next';
import { h } from 'vue';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  costPrice: number;
  quantity: number;
  minStock: number;
  category?: string | null;
  unit: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value);
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'sku',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['SKU', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'font-mono text-sm' }, row.getValue('sku')),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Product Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'font-semibold' }, row.getValue('name')),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null;
      return category 
        ? h(Badge, { variant: 'outline' }, () => category)
        : h('span', { class: 'text-muted-foreground text-sm' }, 'N/A');
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Price', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, formatCurrency(row.getValue('price'))),
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Stock', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      const minStock = row.original.minStock;
      const isLow = quantity <= minStock;
      
      return h('div', { class: 'flex items-center gap-2' }, [
        isLow && h(AlertTriangle, { class: 'h-4 w-4 text-destructive' }),
        h(Badge, { 
          variant: isLow ? 'destructive' : 'secondary' 
        }, () => `${quantity} ${row.original.unit}`)
      ]);
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original;

      return h(DropdownMenu, null, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () => [
              h('span', { class: 'sr-only' }, 'Open menu'),
              h(MoreHorizontal, { class: 'h-4 w-4' })
            ])
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuLabel, null, () => 'Actions'),
            h(DropdownMenuSeparator),
            h(DropdownMenuItem, {
              onClick: () => {
                const event = new CustomEvent('view-product', { detail: product });
                window.dispatchEvent(event);
              }
            }, () => [
              h(Eye, { class: 'mr-2 h-4 w-4' }),
              'View Details'
            ]),
            h(DropdownMenuItem, {
              onClick: () => {
                const event = new CustomEvent('edit-product', { detail: product });
                window.dispatchEvent(event);
              }
            }, () => [
              h(Pencil, { class: 'mr-2 h-4 w-4' }),
              'Edit'
            ]),
            h(DropdownMenuSeparator),
            h(DropdownMenuItem, {
              class: 'text-destructive',
              onClick: () => {
                const event = new CustomEvent('delete-product', { detail: product });
                window.dispatchEvent(event);
              }
            }, () => [
              h(Trash2, { class: 'mr-2 h-4 w-4' }),
              'Delete'
            ]),
          ])
        ]
      });
    },
  },
];