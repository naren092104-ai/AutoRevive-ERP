import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportProgressCallback {
  (current: number, total: number, message: string): void;
}

function convertOklchToRgb(cssText: string): string {
  const oklchRegex = /oklch\([^)]+\)/g;
  const matches = cssText.match(oklchRegex);
  if (!matches || matches.length === 0) return cssText;

  const unique = Array.from(new Set(matches));
  const map = new Map<string, string>();

  const testEl = document.createElement('div');
  testEl.style.position = 'absolute';
  testEl.style.visibility = 'hidden';
  testEl.style.pointerEvents = 'none';
  document.body.appendChild(testEl);

  for (const c of unique) {
    try {
      testEl.style.color = '';
      testEl.style.color = c;
      const computed = window.getComputedStyle(testEl).color;
      map.set(c, computed && computed !== '' ? computed : '#0f172a');
    } catch {
      map.set(c, '#0f172a');
    }
  }
  testEl.remove();

  return cssText
    .replace(oklchRegex, (match) => map.get(match) || match)
    .replace(/color-mix\([^)]+\)/g, 'transparent');
}

function preparePdfClone(clonedDocument: Document, pageId: string): void {
  const clonedWrapper = clonedDocument.querySelector('.zoom-wrapper') as HTMLElement | null;
  if (clonedWrapper) clonedWrapper.style.transform = 'none';

  const clonedPage = clonedDocument.getElementById(pageId);
  if (clonedPage) {
    clonedPage.style.margin = '0';
    clonedPage.style.transform = 'none';
  }

  // Sanitize any existing inline style tags using actual browser-computed RGB values
  clonedDocument.querySelectorAll('style').forEach((style) => {
    style.textContent = convertOklchToRgb(style.textContent || '');
  });

  // Extract all rules from live stylesheets and inject sanitized inline CSS
  try {
    let extractedCss = '';
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        for (let j = 0; j < sheet.cssRules.length; j++) {
          extractedCss += sheet.cssRules[j].cssText + '\n';
        }
      } catch {
        // Ignore cross-origin sheets if any
      }
    }
    if (extractedCss) {
      const sanitized = convertOklchToRgb(extractedCss);
      const inlineStyle = clonedDocument.createElement('style');
      inlineStyle.textContent = sanitized;
      clonedDocument.head.appendChild(inlineStyle);
    }
  } catch (e) {
    console.warn('Could not inline stylesheets for PDF clone:', e);
  }

  // Remove link tags so html2canvas won't attempt network fetch or crash on external CSS
  clonedDocument.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });

  const pdfOverrides = clonedDocument.createElement('style');
  pdfOverrides.textContent = `
    * { box-shadow: none !important; }
    img { background-color: transparent !important; }
    .a4-page { background-color: #ffffff !important; box-shadow: none !important; border: 1.5px solid #cbd5e1 !important; border-top: 5px solid #EA580C !important; }
    .official-letterhead { display: block !important; visibility: visible !important; }
  `;
  clonedDocument.head.appendChild(pdfOverrides);
}

/**
 * High-definition multi-page PDF generator for A4 corporate documents
 */
export async function exportToPdf(
  containerId: string, 
  filename: string = 'AutoRevive_Document.pdf',
  onProgress?: ExportProgressCallback
): Promise<boolean> {
  const container = document.getElementById(containerId) || document.querySelector('.print-container');
  if (!container) {
    console.error('Print container not found');
    return false;
  }

  // Find all individual A4 pages
  const pages = container.querySelectorAll<HTMLElement>('.a4-page');
  if (!pages || pages.length === 0) {
    console.error('No .a4-page elements found');
    return false;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pages[i];
      if (onProgress) {
        onProgress(i + 1, totalPages, `Rendering page ${i + 1} of ${totalPages}...`);
      }

      // Hide shadows, border outlines temporarily for crisp render
      const origShadow = pageEl.style.boxShadow;
      const origMargin = pageEl.style.margin;
      pageEl.style.boxShadow = 'none';
      pageEl.style.margin = '0';

      const canvas = await html2canvas(pageEl, {
        scale: 2, // High resolution crispness
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 20000,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDocument) => preparePdfClone(clonedDocument, pageEl.id),
      });

      // Restore styling
      pageEl.style.boxShadow = origShadow;
      pageEl.style.margin = origMargin;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Add image taking full A4 (210mm x 297mm)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    if (onProgress) {
      onProgress(totalPages, totalPages, 'Saving PDF file...');
    }

    // Save triggers direct browser download
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: try window print if direct PDF generation fails
    openPrintDialog(containerId);
    return false;
  }
}

/**
 * Generate PDF as Base64 Data URI string (for email attachments)
 */
export async function generatePdfBase64(
  containerId: string = 'document-print-area',
  onProgress?: ExportProgressCallback
): Promise<string | null> {
  const container = document.getElementById(containerId) || document.querySelector('.print-container');
  if (!container) {
    console.error('Print container not found for base64 generation');
    return null;
  }

  const pages = container.querySelectorAll<HTMLElement>('.a4-page');
  if (!pages || pages.length === 0) {
    console.error('No .a4-page elements found');
    return null;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pages[i];
      if (onProgress) {
        onProgress(i + 1, totalPages, `Rendering page ${i + 1} of ${totalPages} for email attachment...`);
      }

      const origShadow = pageEl.style.boxShadow;
      const origMargin = pageEl.style.margin;
      pageEl.style.boxShadow = 'none';
      pageEl.style.margin = '0';

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 20000,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDocument) => preparePdfClone(clonedDocument, pageEl.id),
      });

      pageEl.style.boxShadow = origShadow;
      pageEl.style.margin = origMargin;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    if (onProgress) {
      onProgress(totalPages, totalPages, 'Encoding PDF attachment...');
    }

    const base64Uri = pdf.output('datauristring');
    return base64Uri;
  } catch (error) {
    console.error('Error generating PDF Base64:', error);
    return null;
  }
}


/**
 * Clean native print window popup that avoids iframe sandboxing issues
 * Ensures print page breaks happen cleanly per A4 sheet with 100% accurate margins
 */
export function openPrintDialog(containerId: string = 'document-print-area'): void {
  // If in iframe and window.print is directly callable, we can also use window.print()
  const printEl = document.querySelector('.print-container') || document.getElementById(containerId);
  if (!printEl) {
    window.print();
    return;
  }

  // Get all styles from current document
  let styleTags = '';
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  styles.forEach((style) => {
    styleTags += style.outerHTML;
  });

  const printMarkup = printEl.innerHTML
    .replaceAll('src="/autorevive-logo.svg"', `src="${window.location.origin}/autorevive-logo.svg"`)
    .replaceAll('src="/autorevive-logo.png"', `src="${window.location.origin}/autorevive-logo.png"`)
    .replaceAll('src="/autorevive-logo-tight.png"', `src="${window.location.origin}/autorevive-logo-tight.png"`);

  const printWindow = window.open('', '_blank', 'width=950,height=1050');
  if (!printWindow) {
    // Popup blocked in iframe, fallback directly to window.print()
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>AutoRevive - Official Document</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Great+Vibes&family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            gap: 0 !important;
          }
          .a4-page {
            width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 16px 26px 14px 26px !important;
            box-shadow: none !important;
            border: 1.5px solid #cbd5e1 !important;
            border-top: 5px solid #EA580C !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-before: auto !important;
            break-after: page !important;
            break-inside: avoid !important;
            position: relative !important;
            overflow: hidden !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          .official-letterhead {
            display: block !important;
            visibility: visible !important;
          }
          .content-layer {
            flex: 1 1 auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 100% !important;
          }
          svg {
            overflow: visible !important;
            display: inline-block !important;
          }
          .a4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printMarkup}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 1200);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
