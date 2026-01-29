// server/api/reports/sales-by-user.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getSalesByUser(event);
});