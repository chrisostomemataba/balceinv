import { ProductsService } from '../../services/products.service';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  return await ProductsService.delete(id);
});