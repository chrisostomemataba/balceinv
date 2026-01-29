// server/api/reports/export-excel.get.ts
import { ReportsService } from '../../services/reports.service';

export default defineEventHandler(async (event) => {
  const buffer = await ReportsService.exportExcelReport(event);
  
  const query = getQuery(event);
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  
  const today = new Date().toISOString().split('T')[0];
  const filename = startDate && endDate
    ? `Business_Report_${startDate}_to_${endDate}.xlsx`
    : `Business_Report_${today}.xlsx`;
  
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  setResponseHeader(event, 'Content-Disposition', `attachment; filename=${filename}`);
  
  return buffer;
});