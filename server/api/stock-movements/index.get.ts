// server/api/stock-movements/index.get.ts
import { StockMovementsService } from '../../services/stock-movements.service';

export default defineEventHandler(async (event) => {
  return await StockMovementsService.getAll(event);
});