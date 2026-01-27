// server/api/sales/[id].get.ts
import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  return await SalesService.getSaleById(id);
});