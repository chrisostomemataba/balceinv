import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  return await SalesService.getAllSales(event);
});
