// server/api/stock-movements/product/[id].get.ts
import { StockMovementsService } from '../../../services/stock-movements.service';

export default defineEventHandler(async (event) => {
  const productId = Number(event.context.params?.id);
  return await StockMovementsService.getByProduct(productId);
});