import { ProductsService } from '../../services/products.service';

export default defineEventHandler(async (event) => {
  const buffer = ProductsService.getTemplate();
  
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename=products-template.xlsx');
  
  return buffer;
});