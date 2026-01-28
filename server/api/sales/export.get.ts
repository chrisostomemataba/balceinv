
import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
  const endDate = query.endDate ? new Date(query.endDate as string) : undefined;
  
  const buffer = await SalesService.exportSalesReport(startDate, endDate);
  
  const today = new Date().toISOString().split('T')[0];
  const filename = startDate && endDate 
    ? `Sales_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.xlsx`
    : `Sales_Report_${today}.xlsx`;
  
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  setResponseHeader(event, 'Content-Disposition', `attachment; filename=${filename}`);
  
  return buffer;
});