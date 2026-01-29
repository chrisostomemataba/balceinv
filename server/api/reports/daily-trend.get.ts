// server/api/reports/daily-trend.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getDailySalesTrend(event);
}); 