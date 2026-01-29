// server/api/stock-movements/summary.get.ts
import { StockMovementsService } from '../../services/stock-movements.service';

export default defineEventHandler(async (event) => {
  return await StockMovementsService.getSummary();
});