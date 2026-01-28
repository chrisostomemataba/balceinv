import { SalesService } from '../../services/sales.service';

export default defineEventHandler((event) => {
  const buffer = SalesService.getSalesTemplate();
  
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename=Sales_Import_Template.xlsx');
  
  return buffer;
});