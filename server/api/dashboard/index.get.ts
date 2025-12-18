import { DashboardService } from '../../services/DashboardService'

export default defineEventHandler(async () => {
  const [summary, dailySales, topProducts] = await Promise.all([
    DashboardService.getSummary(),
    DashboardService.getDailySales(),
    DashboardService.getTopProducts(),
  ])

  return {
    summary,
    dailySales,
    topProducts,
  }
})