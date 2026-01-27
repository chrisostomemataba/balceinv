// server/api/sales/monthly.get.ts
import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const year = query.year ? Number(query.year) : new Date().getFullYear();
  const month = query.month ? Number(query.month) : new Date().getMonth() + 1;
  
  return await SalesService.getMonthlySales(year, month);
});
