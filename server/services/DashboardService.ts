import { PrismaClient } from '../../generated/prisma/client'

const prisma = new PrismaClient()

export class DashboardService {
  static async getSummary() {
    const [
      userCount,
      productCount,
      saleCount,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.sale.count(),
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
      }).then(r => r._sum.totalAmount || 0),
    ])

    return {
      userCount,
      productCount,
      saleCount,
      totalRevenue,
    }
  }

  static async getDailySales(lastDays = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - lastDays)

    const raw = await prisma.sale.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalAmount: true },
      orderBy: { createdAt: 'asc' },
    })

    // Map to simple { date, total } objects
    return raw.map(r => ({
      date: r.createdAt.toISOString().slice(0, 10), // YYYY-MM-DD
      total: Number(r._sum.totalAmount),
    }))
  }

  static async getTopProducts(limit = 5) {
    const top = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })

    const productIds = top.map(t => t.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    })

    const map = new Map(products.map(p => [p.id, p]))
    return top.map(t => ({
      ...map.get(t.productId)!,
      totalSold: t._sum.quantity,
    }))
  }
}