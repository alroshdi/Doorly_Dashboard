import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportOptions {
  title?: string;
  filename?: string;
  includeKPIs?: boolean;
  includeCharts?: boolean;
  includeTables?: boolean;
}

export async function exportDashboardToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = "Doorly Dashboard Report",
    filename = `doorly-report-${new Date().toISOString().split("T")[0]}.pdf`,
    includeKPIs = true,
    includeCharts = true,
    includeTables = true,
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found for PDF export");
    }

    // Show loading indicator
    const loadingToast = document.createElement("div");
    loadingToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3B82F6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
    `;
    loadingToast.textContent = "Generating PDF...";
    document.body.appendChild(loadingToast);

    // Scroll to top to capture full content
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter content based on options before capturing
    const originalDisplay: { element: HTMLElement; display: string }[] = [];
    
    if (!includeKPIs) {
      const kpiSections = element.querySelectorAll('[data-kpi-section]');
      kpiSections.forEach((section) => {
        const el = section as HTMLElement;
        originalDisplay.push({ element: el, display: el.style.display });
        el.style.display = "none";
      });
    }
    if (!includeCharts) {
      const chartSections = element.querySelectorAll('[data-chart-section]');
      chartSections.forEach((section) => {
        const el = section as HTMLElement;
        originalDisplay.push({ element: el, display: el.style.display });
        el.style.display = "none";
      });
    }
    if (!includeTables) {
      const tableSections = element.querySelectorAll('[data-table-section]');
      tableSections.forEach((section) => {
        const el = section as HTMLElement;
        originalDisplay.push({ element: el, display: el.style.display });
        el.style.display = "none";
      });
    }

    // Convert to canvas
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Restore original display
    originalDisplay.forEach(({ element: el, display }) => {
      el.style.display = display;
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2);
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = contentWidth / imgWidth;
    const imgScaledHeight = imgHeight * ratio;

    // Add title
    pdf.setFontSize(18);
    pdf.text(title, pdfWidth / 2, 15, { align: "center" });
    
    // Add date
    pdf.setFontSize(10);
    pdf.text(
      `Generated on: ${new Date().toLocaleString()}`,
      pdfWidth / 2,
      22,
      { align: "center" }
    );

    // Calculate number of pages needed
    const pageHeight = pdfHeight - 35; // Leave space for title and date
    const totalPages = Math.ceil(imgScaledHeight / pageHeight);

    // Add content to PDF
    let yPosition = 30;
    let sourceY = 0;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
        yPosition = 10;
      }

      const pageHeightPx = Math.min(pageHeight / ratio, imgHeight - sourceY);
      const canvasPage = document.createElement("canvas");
      canvasPage.width = imgWidth;
      canvasPage.height = pageHeightPx;
      const ctx = canvasPage.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          imgWidth,
          pageHeightPx,
          0,
          0,
          imgWidth,
          pageHeightPx
        );
      }

      const pageImgData = canvasPage.toDataURL("image/png");
      const pageImgScaledHeight = pageHeightPx * ratio;

      pdf.addImage(
        pageImgData,
        "PNG",
        margin,
        yPosition,
        contentWidth,
        pageImgScaledHeight
      );

      sourceY += pageHeightPx;
    }

    // Save PDF
    pdf.save(filename);

    // Update loading message
    loadingToast.textContent = "PDF exported successfully!";
    loadingToast.style.background = "#10B981";
    
    setTimeout(() => {
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
    }, 2000);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    const errorMsg = document.createElement("div");
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorMsg.textContent = "Failed to export PDF. Please try again.";
    document.body.appendChild(errorMsg);
    setTimeout(() => {
      if (document.body.contains(errorMsg)) {
        document.body.removeChild(errorMsg);
      }
    }, 3000);
  }
}

export async function exportKPIsToPDF(
  kpis: any,
  title: string = "KPI Report"
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 30;

  // Add title
  pdf.setFontSize(18);
  pdf.text(title, pdfWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Add date
  pdf.setFontSize(10);
  pdf.text(
    `Generated on: ${new Date().toLocaleString()}`,
    pdfWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 15;

  // Add KPIs
  pdf.setFontSize(14);
  pdf.text("Key Performance Indicators", margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  Object.entries(kpis).forEach(([key, value]) => {
    if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.text(
      `${key}: ${typeof value === "number" ? value.toLocaleString() : value}`,
      margin,
      yPosition
    );
    yPosition += 8;
  });

  pdf.save(`kpi-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

