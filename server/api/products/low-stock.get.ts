import { ProductsService } from '../../services/products.service';

export default defineEventHandler(async (event) => {
  return await ProductsService.getLowStock();
});