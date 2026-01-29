// server/api/reports/sales-summary.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getSalesSummary(event);
});