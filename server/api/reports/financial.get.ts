// server/api/reports/financial.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getFinancialReport(event);
});