import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { endOfDay, startOfDay, date } from '@/lib/format';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit-table';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  
  const params = new URL(request.url).searchParams;
  const format = params.get('format') || 'excel';
  const type = params.get('type') || '';
  const from = startOfDay(params.get('from') ? new Date(params.get('from')!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const to = endOfDay(params.get('to') ? new Date(params.get('to')!) : new Date());
  const productId = Number(params.get('productId')) || undefined;
  
  const orders = (type === '' || type === 'penjualan') ? await prisma.order.findMany({
    where: { 
      status: 'SELESAI', 
      OR: [{ completedAt: { gte: from, lte: to } }, { completedAt: null, createdAt: { gte: from, lte: to } }],
      ...(productId ? { items: { some: { productId } } } : {}) 
    },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  }) : [];

  const purchases = (type === '' || type === 'pembelian') ? await prisma.purchase.findMany({
    where: { date: { gte: from, lte: to } },
    include: { items: { include: { product: true } } },
    orderBy: { date: 'asc' },
  }) : [];

  const logoPath = path.join(process.cwd(), 'public', 'lapak-udang-ikan-logo.png');

  if (format === 'pdf') {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          resolve(new NextResponse(Buffer.concat(chunks), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename="laporan-transaksi.pdf"',
            },
          }));
        });

        if (fs.existsSync(logoPath)) doc.image(logoPath, 30, 30, { width: 40 });
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1E3A8A').text(`LAPORAN TRANSAKSI - LAPAK UDANG & IKAN`, 80, 35);
        doc.font('Helvetica').fontSize(10).fillColor('#64748B').text(`Periode: ${date(from)} - ${date(to)} | Jenis: ${type==='pembelian'?'Pembelian':(type==='penjualan'?'Penjualan':'Semua')}`, 80, 52);
        doc.moveDown(2);

        if (type === '' || type === 'penjualan') {
          doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text('PENJUALAN', 30);
          doc.moveDown(0.5);
          let grandTotal = 0;
          const tableData = orders.map((order, i) => {
            grandTotal += Number(order.totalAmount);
            return [
              String(i + 1),
              order.orderNumber,
              (order.completedAt || order.createdAt) ? new Date((order.completedAt || order.createdAt)!.getTime() + 7*3600*1000).toISOString().slice(0, 10) : '-',
              order.items.map(item => `${item.product.name} (${Number(item.quantity)} ${item.product.unit})`).join('\n'),
              'Rp ' + Number(order.totalAmount).toLocaleString('id-ID'),
              order.paymentType,
            ];
          });
          await doc.table({
            headers: [
              { label: 'No', property: 'no', width: 25, align: 'center' },
              { label: 'Nomor Pesanan', property: 'order', width: 100 },
              { label: 'Tanggal', property: 'date', width: 65, align: 'center' },
              { label: 'Produk', property: 'product', width: 170 },
              { label: 'Total (Omzet)', property: 'total', width: 90, align: 'right' },
              { label: 'Pembayaran', property: 'pay', width: 70, align: 'center' },
            ],
            rows: tableData,
          }, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor('black'),
            prepareRow: (row, iColumn, iRow, rectRow, rectCell) => doc.font('Helvetica').fontSize(9).fillColor('black'),
          });
          doc.moveDown();
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E3A8A').text(`TOTAL OMZET: Rp ${grandTotal.toLocaleString('id-ID')}`, { align: 'right' });
          doc.moveDown(2);
        }

        if (type === '' || type === 'pembelian') {
          doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text('PEMBELIAN', 30);
          doc.moveDown(0.5);
          let grandTotal = 0;
          const tableData = purchases.map((p, i) => {
            grandTotal += Number(p.totalAmount);
            return [
              String(i + 1),
              p.invoiceNumber || '-',
              new Date(p.date.getTime() + 7*3600*1000).toISOString().slice(0, 10),
              p.items.map((item:any) => `${item.product.name} (${Number(item.quantity)} ${item.product.unit})`).join('\n'),
              'Rp ' + Number(p.totalAmount).toLocaleString('id-ID'),
              p.paymentType,
            ];
          });
          await doc.table({
            headers: [
              { label: 'No', property: 'no', width: 25, align: 'center' },
              { label: 'Nomor Faktur', property: 'invoice', width: 100 },
              { label: 'Tanggal', property: 'date', width: 65, align: 'center' },
              { label: 'Produk', property: 'product', width: 170 },
              { label: 'Total', property: 'total', width: 90, align: 'right' },
              { label: 'Pembayaran', property: 'pay', width: 70, align: 'center' },
            ],
            rows: tableData,
          }, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor('black'),
            prepareRow: (row, iColumn, iRow, rectRow, rectCell) => doc.font('Helvetica').fontSize(9).fillColor('black'),
          });
          doc.moveDown();
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E3A8A').text(`TOTAL PEMBELIAN: Rp ${grandTotal.toLocaleString('id-ID')}`, { align: 'right' });
        }

        doc.end();
      } catch (err) {
        console.error("PDF Table Error:", err);
        reject(err);
      }
    });
  }

  // EXCEL
  const workbook = new ExcelJS.Workbook();
  const wsTitle = type === 'pembelian' ? 'Laporan Pembelian' : type === 'penjualan' ? 'Laporan Penjualan' : 'Laporan Transaksi';
  const ws = workbook.addWorksheet(wsTitle);
  
  setupWorksheet(ws, `${wsTitle.toUpperCase()} - LAPAK UDANG & IKAN`, from, to, logoPath, workbook);

  if (type === '' || type === 'penjualan') {
    if (type === '') {
      const titleRow = ws.addRow(['PENJUALAN']);
      titleRow.font = { bold: true, size: 12 };
      ws.addRow([]);
    }
    const headerRow = ws.addRow(['No', 'Nomor Pesanan', 'Tanggal', 'Produk', 'Total (Omzet)', 'Pembayaran']);
    styleHeader(headerRow);

    let grandTotal = 0;
    orders.forEach((order, index) => {
      grandTotal += Number(order.totalAmount);
      const row = ws.addRow([
        index + 1,
        order.orderNumber,
        (order.completedAt || order.createdAt) ? new Date((order.completedAt || order.createdAt)!.getTime() + 7*3600*1000).toISOString().slice(0, 10) : '-',
        order.items.map((item) => `${item.product.name} (${Number(item.quantity)} ${item.product.unit})`).join('\n'),
        Number(order.totalAmount),
        order.paymentType
      ]);
      styleDataRow(row, order.items.length);
    });
    addTotalRow(ws, grandTotal);
  }

  if (type === '') {
    ws.addRow([]);
    ws.addRow([]);
  }

  if (type === '' || type === 'pembelian') {
    if (type === '') {
      const titleRow = ws.addRow(['PEMBELIAN']);
      titleRow.font = { bold: true, size: 12 };
      ws.addRow([]);
    }
    const headerRow = ws.addRow(['No', 'Nomor Faktur', 'Tanggal', 'Produk', 'Total (Pengeluaran)', 'Pembayaran']);
    styleHeader(headerRow);

    let grandTotal = 0;
    purchases.forEach((p, index) => {
      grandTotal += Number(p.totalAmount);
      const row = ws.addRow([
        index + 1,
        p.invoiceNumber || '-',
        new Date(p.date.getTime() + 7*3600*1000).toISOString().slice(0, 10),
        p.items.map((item:any) => `${item.product.name} (${Number(item.quantity)} ${item.product.unit})`).join('\n'),
        Number(p.totalAmount),
        p.paymentType
      ]);
      styleDataRow(row, p.items.length);
    });
    addTotalRow(ws, grandTotal);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-transaksi-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  });
}

function setupWorksheet(worksheet: ExcelJS.Worksheet, title: string, from: Date, to: Date, logoPath: string, workbook: ExcelJS.Workbook) {
  worksheet.pageSetup = {
    paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };
  worksheet.columns = [
    { width: 5 }, { width: 28 }, { width: 14 }, { width: 45 }, { width: 18 }, { width: 15 }
  ];
  worksheet.getRow(1).height = 40;
  
  if (fs.existsSync(logoPath)) {
    const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath) as any, extension: 'png' });
    worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 40, height: 40 } });
  }
  worksheet.mergeCells('B1:F1');
  worksheet.getCell('B1').value = title;
  worksheet.getCell('B1').font = { size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('B2:F2');
  worksheet.getCell('B2').value = `Periode: ${date(from)} - ${date(to)}`;
  worksheet.getCell('B2').font = { size: 11, color: { argb: 'FF64748B' } };
  worksheet.getCell('B2').alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.addRow([]);
}

function styleHeader(headerRow: ExcelJS.Row) {
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
}

function styleDataRow(row: ExcelJS.Row, itemCount: number) {
  row.height = Math.max(30, itemCount * 20);
  row.eachCell((cell, colNumber) => {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (colNumber === 5) cell.numFmt = '"Rp "#,##0;[Red]\\-"Rp "#,##0';
    if (colNumber === 1 || colNumber === 3 || colNumber === 6) {
       cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }
  });
}

function addTotalRow(worksheet: ExcelJS.Worksheet, grandTotal: number) {
  const totalRow = worksheet.addRow(['', '', '', 'TOTAL KESELURUHAN', grandTotal, '']);
  totalRow.height = 25;
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber >= 4) {
      cell.font = { bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = { top: { style: 'double' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle' };
      if (colNumber === 5) cell.numFmt = '"Rp "#,##0;[Red]\\-"Rp "#,##0';
    }
  });
  worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);
}
