import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown, Eye, TrendingUp, TrendingDown } from 'lucide-vue-next';
import { h } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StockMovement {
  id: number;
  productId: number;
  change: number;
  newQuantity: number;
  reason: string;
  reference?: string | null;
  createdAt: Date;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
  user?: {
    name: string;
  };
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const getReasonBadge = (reason: string) => {
  const variants: Record<string, any> = {
    sale: 'destructive',
    purchase: 'default',
    adjust: 'secondary',
    damage: 'outline'
  };
  return variants[reason] || 'secondary';
};

const getReasonLabel = (reason: string): string => {
  const labels: Record<string, string> = {
    sale: 'Sale',
    purchase: 'Purchase',
    adjust: 'Adjustment',
    damage: 'Damage'
  };
  return labels[reason] || reason;
};

export const columns: ColumnDef<StockMovement>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'text-sm' }, formatDate(row.getValue('createdAt'))),
  },
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => {
      const product = row.original.product;
      return h('div', { class: 'space-y-1' }, [
        h('p', { class: 'font-medium' }, product?.name || 'N/A'),
        h('p', { class: 'text-xs text-muted-foreground font-mono' }, product?.sku || '')
      ]);
    },
  },
  {
    accessorKey: 'change',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Change', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => {
      const change = row.getValue('change') as number;
      const isPositive = change > 0;
      
      return h('div', { 
        class: `flex items-center gap-1 font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}` 
      }, [
        isPositive 
          ? h(TrendingUp, { class: 'h-4 w-4' })
          : h(TrendingDown, { class: 'h-4 w-4' }),
        h('span', null, `${isPositive ? '+' : ''}${change}`)
      ]);
    },
  },
  {
    accessorKey: 'newQuantity',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['New Stock', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => {
      const quantity = row.getValue('newQuantity') as number;
      const unit = row.original.product?.unit || 'pcs';
      return h('div', { class: 'font-medium' }, `${quantity} ${unit}`);
    },
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => {
      const reason = row.getValue('reason') as string;
      return h(Badge, { variant: getReasonBadge(reason) }, () => getReasonLabel(reason));
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => {
      const reference = row.getValue('reference') as string | null;
      return h('div', { class: 'text-sm font-mono' }, reference || '-');
    },
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original.user;
      return h('div', { class: 'text-sm' }, user?.name || 'System');
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const movement = row.original;

      return h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          const event = new CustomEvent('view-movement', { detail: movement });
          window.dispatchEvent(event);
        }
      }, () => [
        h(Eye, { class: 'mr-2 h-4 w-4' }),
        'Details'
      ]);
    },
  },
];