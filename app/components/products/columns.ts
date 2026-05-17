import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle } from 'lucide-vue-next'
import { h } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface Product {
  id: number
  name: string
  sku: string
  barcode?: string | null
  price: number
  cost_price: number
  quantity: number
  min_stock: number
  wholesale_price?: number | null
  wholesale_min?: number | null
  category?: string | null
  unit: string
  pieces_per_unit: number
  metadata?: Record<string, any> | null
}

export interface ActionHandlers {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  canEdit: boolean
  canDelete: boolean
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value)
}

export const createColumns = (handlers: ActionHandlers): ColumnDef<Product>[] => [
  {
    accessorKey: 'sku',
    header: ({ column }) =>
      h(Button, { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
        () => ['SKU', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]),
    cell: ({ row }) => h('div', { class: 'font-mono text-sm' }, row.getValue('sku')),
  },
  {
    accessorKey: 'name',
    header: ({ column }) =>
      h(Button, { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
        () => ['Product Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]),
    cell: ({ row }) => h('div', { class: 'font-semibold' }, row.getValue('name')),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null
      return category
        ? h(Badge, { variant: 'outline' }, () => category)
        : h('span', { class: 'text-muted-foreground text-sm' }, 'N/A')
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'price',
    header: ({ column }) =>
      h(Button, { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
        () => ['Price', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]),
    cell: ({ row }) => h('div', { class: 'font-medium' }, formatCurrency(row.getValue('price'))),
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) =>
      h(Button, { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
        () => ['Stock', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]),
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number
      const minStock = row.original.min_stock
      const isLow = quantity <= minStock
      return h('div', { class: 'flex items-center gap-2' }, [
        isLow && h(AlertTriangle, { class: 'h-4 w-4 text-destructive' }),
        h(Badge, { variant: isLow ? 'destructive' : 'secondary' }, () => `${quantity} ${row.original.unit}`)
      ])
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original
      const menuItems = [
        h(DropdownMenuLabel, null, () => 'Actions'),
        h(DropdownMenuSeparator),
        h(DropdownMenuItem, { onClick: () => handlers.onView(product) }, () => [
          h(Eye, { class: 'mr-2 h-4 w-4' }), 'View Details'
        ]),
      ]

      if (handlers.canEdit) {
        menuItems.push(
          h(DropdownMenuItem, { onClick: () => handlers.onEdit(product) }, () => [
            h(Pencil, { class: 'mr-2 h-4 w-4' }), 'Edit'
          ])
        )
      }

      if (handlers.canDelete) {
        menuItems.push(h(DropdownMenuSeparator))
        menuItems.push(
          h(DropdownMenuItem, { class: 'text-destructive', onClick: () => handlers.onDelete(product) }, () => [
            h(Trash2, { class: 'mr-2 h-4 w-4' }), 'Delete'
          ])
        )
      }

      return h(DropdownMenu, null, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', class: 'h-8 w-8 p-0' }, () => [
              h('span', { class: 'sr-only' }, 'Open menu'),
              h(MoreHorizontal, { class: 'h-4 w-4' })
            ])
          ),
          h(DropdownMenuContent, { align: 'end' }, () => menuItems)
        ]
      })
    },
  },
]