// server/api/stock-movements/[id].get.ts
import { StockMovementsService } from '../../services/stock-movements.service';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  return await StockMovementsService.getById(id);
});