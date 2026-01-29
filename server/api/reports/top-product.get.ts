// server/api/reports/top-products.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  return await ReportsService.getTopProducts(event);
});