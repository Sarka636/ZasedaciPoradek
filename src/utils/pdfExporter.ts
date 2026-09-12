import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { ClassroomConfig } from '../types';

/**
 * Captures an HTML element (the graphic seating plan) and downloads it as a high-quality PDF.
 * Uses html-to-image to support modern browser CSS colors (including OKLCH).
 */
export async function exportGraphicPlanToPdf(
  elementId: string,
  config: ClassroomConfig
): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Nepodařilo se nalézt element zasedacího pořádku.');
  }

  // Generate crisp PNG data url with native browser rendering (supports oklch, modern fonts, flex, grid)
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2, // 2x crisp resolution for printing
    backgroundColor: '#ffffff',
    cacheBust: true,
  });

  // Calculate natural image dimensions
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Chyba při načítání vygenerovaného obrázku pro PDF.'));
  });

  // Create landscape A4 PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calculate proportional dimensions with clean margins
  const margin = 10; // mm
  const maxContentWidth = pageWidth - 2 * margin;
  const maxContentHeight = pageHeight - 2 * margin;

  let imgWidth = maxContentWidth;
  let imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

  if (imgHeight > maxContentHeight) {
    imgHeight = maxContentHeight;
    imgWidth = (img.naturalWidth * imgHeight) / img.naturalHeight;
  }

  const posX = (pageWidth - imgWidth) / 2;
  const posY = (pageHeight - imgHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', posX, posY, imgWidth, imgHeight, undefined, 'FAST');

  const cleanClassName = (config.className || 'trida')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `zasedaci_poradek_${cleanClassName}_${dateStr}.pdf`;

  pdf.save(filename);
  return filename;
}

