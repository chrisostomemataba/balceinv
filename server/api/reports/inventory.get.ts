// server/api/reports/inventory.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getInventoryReport();
});