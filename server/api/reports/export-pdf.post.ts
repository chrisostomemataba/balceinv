// server/api/reports/export-pdf.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const html = body.html as string;
  const filename = body.filename as string || 'report.pdf';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 20px;
            color: #475569;
            margin-top: 10px;
          }
          .date-range {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 13px;
          }
          th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #334155;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:hover { background: #f8fafc; }
          .metric-card {
            display: inline-block;
            width: 48%;
            margin: 1%;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          .metric-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-success { color: #16a34a; font-weight: 600; }
          .text-danger { color: #dc2626; font-weight: 600; }
          .text-muted { color: #64748b; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  try {
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true
    });

    await browser.close();

    setResponseHeader(event, 'Content-Type', 'application/pdf');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename=${filename}`);
    
    return pdf;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to generate PDF. Using alternative method.'
    });
  }
});