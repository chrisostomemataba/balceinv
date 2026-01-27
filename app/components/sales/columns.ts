import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown, Eye, CreditCard, Smartphone, Banknote } from 'lucide-vue-next';
import { h } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Sale {
  id: number;
  receiptNumber: string;
  totalAmount: number;
  paymentType: string;
  saleType: string;
  taxAmount: number;
  createdAt: Date;
  user?: {
    name: string;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const getPaymentIcon = (paymentType: string) => {
  switch (paymentType) {
    case 'cash':
      return Banknote;
    case 'card':
      return CreditCard;
    case 'mobile':
      return Smartphone;
    default:
      return Banknote;
  }
};

export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: 'receiptNumber',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Receipt #', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'font-mono text-sm font-medium' }, row.getValue('receiptNumber')),
  },
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
    accessorKey: 'totalAmount',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Amount', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]);
    },
    cell: ({ row }) => h('div', { class: 'font-semibold' }, formatCurrency(row.getValue('totalAmount'))),
  },
  {
    accessorKey: 'paymentType',
    header: 'Payment',
    cell: ({ row }) => {
      const paymentType = row.getValue('paymentType') as string;
      const Icon = getPaymentIcon(paymentType);
      
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Icon, { class: 'h-4 w-4 text-muted-foreground' }),
        h('span', { class: 'capitalize' }, paymentType)
      ]);
    },
  },
  {
    accessorKey: 'saleType',
    header: 'Type',
    cell: ({ row }) => {
      const saleType = row.getValue('saleType') as string;
      return h(Badge, { 
        variant: saleType === 'wholesale' ? 'default' : 'secondary' 
      }, () => saleType === 'wholesale' ? 'Wholesale' : 'Retail');
    },
  },
  {
    accessorKey: 'user',
    header: 'Sold By',
    cell: ({ row }) => {
      const user = row.original.user;
      return h('div', { class: 'text-sm' }, user?.name || 'N/A');
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const sale = row.original;

      return h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          const event = new CustomEvent('view-sale', { detail: sale });
          window.dispatchEvent(event);
        }
      }, () => [
        h(Eye, { class: 'mr-2 h-4 w-4' }),
        'Details'
      ]);
    },
  },
];