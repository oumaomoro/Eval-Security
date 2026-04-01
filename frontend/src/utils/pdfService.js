import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Premium PDF Portfolio Service for Costloci Enterprise.
 * Implements a "Board-Ready" executive aesthetic with categorical analysis.
 */
export const generateBrandedPdf = (report, brandingConfig) => {
  const doc = new jsPDF();
  const primaryColor = brandingConfig?.primaryColor || '#2563eb';
  const logoUrl = brandingConfig?.logoUrl;
  const ipRights = brandingConfig?.ip_rights_holder || 'Costloci Partner';
  const watermarkEnabled = brandingConfig?.watermark_enabled || false;
  const watermarkText = brandingConfig?.watermark_text || 'CONFIDENTIAL';
  
  const analysis = report.ai_analysis || {};
  const findings = analysis.categorized_findings || [];

  // --- Utility: Future-Proof Watermarking ---
  const addWatermark = () => {
    if (!watermarkEnabled) return;
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'bold');
      doc.text(watermarkText, 105, 150, { align: 'center', angle: -45 });
      doc.restoreGraphicsState();
    }
  };

  // --- Utility: Page Header ---
  const addHeader = (title) => {
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 13);
    
    if (logoUrl) {
      // Branding logo in top right of every page
      // doc.addImage(logoUrl, 'PNG', 170, 5, 25, 10);
    }
  };

  // --- PAGE 1: EXECUTIVE COVER ---
  doc.setFillColor(30, 41, 59); // Dark slate background
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRACT RISK', 20, 80);
  doc.text('EXECUTIVE PORTFOLIO', 20, 95);
  
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(2);
  doc.line(20, 105, 100, 105);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendor: ${report.vendor_name || 'N/A'}`, 20, 125);
  doc.text(`Generated for: ${brandingConfig?.companyName || 'Costloci Partner'}`, 20, 135);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 145);

  // Trust Score Radial (Simulated)
  const score = analysis.compliance_readiness || 0;
  doc.setLineWidth(0.5);
  doc.setDrawColor(255, 255, 255, 0.2);
  doc.circle(160, 115, 30, 'S');
  doc.setFontSize(30);
  doc.text(`${score}%`, 160, 118, { align: 'center' });
  doc.setFontSize(10);
  doc.text('COMPLIANCE SCORE', 160, 128, { align: 'center' });

  // --- PAGE 2: CATEGORICAL BREAKDOWN ---
  doc.addPage();
  addHeader('EXECUTIVE COMPLIANCE SUMMARY');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.text('Categorical Risk landscape', 15, 40);
  
  const categories = ['legal', 'security', 'compliance', 'financial'];
  let currentY = 55;
  
  categories.forEach(cat => {
    const catFindings = findings.filter(f => f.category === cat);
    const color = cat === 'legal' ? [37, 99, 235] : cat === 'security' ? [220, 38, 38] : [5, 150, 105];
    
    doc.setFillColor(...color);
    doc.roundedRect(15, currentY, 180, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(cat.toUpperCase(), 20, currentY + 8);
    doc.text(`${catFindings.length} Items`, 185, currentY + 8, { align: 'right' });
    
    currentY += 15;
    catFindings.slice(0, 3).forEach(f => {
       doc.setTextColor(71, 85, 105);
       doc.setFontSize(9);
       doc.setFont('helvetica', 'bold');
       doc.text(`• ${f.title}`, 20, currentY);
       doc.setFont('helvetica', 'normal');
       doc.text(doc.splitTextToSize(f.description, 160), 25, currentY + 5);
       currentY += 15;
    });
    currentY += 5;
  });

  // --- PAGE 3: VECTOR GAP ANALYSIS ---
  doc.addPage();
  addHeader('VECTOR ENGINE: GAP ANALYSIS');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text('This section highlights semantic deviations from Gold Standards using RAG mapping.', 15, 30);

  const vectorMatches = findings.filter(f => f.gold_standard_alignment);
  
  doc.autoTable({
    startY: 38,
    head: [['Extracted Clause', 'Alignment', 'Gap Analysis']],
    body: vectorMatches.map(f => [
      f.verbatim_text ? `"${f.verbatim_text.substring(0, 120)}..."` : f.title,
      `${f.gold_standard_alignment.similarity}%`,
      f.gold_standard_alignment.gap_analysis || 'No critical delta detected.'
    ]),
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 88 }
    },
    styles: { fontSize: 8, cellPadding: 4 }
  });

  // --- PAGE 4: AI REMEDIATION PLAN (REDLINES) ---
  const redlines = findings.filter(f => f.gold_standard_alignment?.suggested_redline);
  if (redlines.length > 0) {
    doc.addPage();
    addHeader('AI REMEDIATION PLAN: PROPOSED REDLINES');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text('The following clauses are proposed as replacements to mitigate identified risks.', 15, 30);

    let redlineY = 40;
    redlines.forEach(f => {
      doc.setFillColor(248, 250, 252); // Light slate bg
      const redlineText = f.gold_standard_alignment.suggested_redline;
      const splitText = doc.splitTextToSize(redlineText, 170);
      
      // Smart pagination for massive cyber policy Redlines
      const lineHeight = 5;
      const linesPerPage = 45; // Approx lines that fit cleanly
      let remainingLines = splitText;

      while (remainingLines.length > 0) {
        const chunk = remainingLines.slice(0, linesPerPage);
        remainingLines = remainingLines.slice(linesPerPage);
        const boxHeight = (chunk.length * lineHeight) + 15;

        if (redlineY + boxHeight > 275) {
          doc.addPage();
          addHeader('AI REMEDIATION PLAN (CONT.)');
          redlineY = 30;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, redlineY, 180, boxHeight, 2, 2, 'FD');
        
        doc.setTextColor(primaryColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`REPLACEMENT FOR: ${f.title.toUpperCase()}`, 20, redlineY + 7);
        
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(chunk, 20, redlineY + 15);
        
        redlineY += boxHeight + 10;
      }
    });
  }

  // Footer on all pages except first
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`© ${new Date().getFullYear()} ${ipRights} | Costloci Enterprise`, 15, 285);
    doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
  }

  // Final Pass: Add Watermarks to all pages
  addWatermark();

  doc.save(`${report.vendor_name || 'Contract'}_Portfolio_Analysis.pdf`);
};

export const generateRiskScorecardPdf = (contract, brandingConfig) => {
  const doc = new jsPDF();
  const primaryColor = brandingConfig?.primaryColor || '#dc2626'; // Red for risk theme usually
  const logoUrl = brandingConfig?.logoUrl;
  const ipRights = brandingConfig?.ip_rights_holder || 'Costloci Partner';

  const addHeader = (title) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 16);
    
    if (logoUrl) {
      // doc.addImage(logoUrl, 'PNG', 170, 5, 25, 10);
    }
  };

  addHeader('VENDOR RISK SCORECARD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(24);
  doc.text(contract.vendor_name || 'Vendor', 15, 45);
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Service: ${contract.product_service || 'N/A'}`, 15, 53);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 60);

  // Risk Gauge
  const score = contract.ai_analysis?.compliance_readiness || 0;
  const isHighRisk = score < 60;
  const colorArray = isHighRisk ? [220, 38, 38] : [5, 150, 105];
  
  doc.setLineWidth(2);
  doc.setDrawColor(...colorArray);
  doc.circle(165, 50, 20, 'S');
  doc.setFontSize(22);
  doc.setTextColor(...colorArray);
  doc.text(`${score}%`, 165, 52, { align: 'center' });
  doc.setFontSize(9);
  doc.text('READINESS', 165, 59, { align: 'center' });

  // Critical Findings Summary
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text('Key Vulnerabilities & Gaps', 15, 85);
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 88, 195, 88);

  const findings = contract.ai_analysis?.categorized_findings || [];
  const topFindings = findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 6);

  let y = 100;
  if (topFindings.length === 0) {
    doc.setFontSize(10);
    doc.text('No critical or high-risk vulnerabilities detected.', 15, y);
  } else {
    topFindings.forEach(f => {
      if (y > 270) {
        doc.addPage();
        addHeader('VENDOR RISK SCORECARD (CONT.)');
        y = 40;
      }
      const isCrit = f.severity === 'critical';
      doc.setFillColor(isCrit ? 254 : 255, isCrit ? 226 : 251, isCrit ? 226 : 235);
      doc.roundedRect(15, y - 5, 180, 25, 2, 2, 'F');
      
      doc.setTextColor(isCrit ? 220 : 217, isCrit ? 38 : 119, isCrit ? 38 : 6); 
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${f.severity.toUpperCase()} RISK: ${f.title}`, 20, y + 2);
      
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitDesc = doc.splitTextToSize(f.description, 165);
      // only show up to 3 lines
      doc.text(splitDesc.slice(0, 3), 20, y + 8);
      
      y += 28;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`© ${new Date().getFullYear()} ${ipRights} | Board-Ready Export`, 15, 290);

  doc.save(`${contract.vendor_name || 'Vendor'}_Risk_Scorecard.pdf`);
};
