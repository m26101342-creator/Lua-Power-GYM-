import { jsPDF } from "jspdf";
import { User, UserStatus } from '../types';
import { getUserStatus, formatDate } from '../utils/dateUtils';

const LOGO_URL = "https://i.postimg.cc/K86FS7PH/1000196294_fotor_enhance_20260107104529.jpg";

// Helper to load image and crop it to a circle
const loadRoundedImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Canvas context not available');
        return;
      }

      // Draw circle mask
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Draw image centered
      const x = (size - img.width) / 2;
      const y = (size - img.height) / 2;
      ctx.drawImage(img, x, y, img.width, img.height);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
  });
};

export const generateClientPDF = async (client: User) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const statusData = getUserStatus(client);

  // Design Constants
  const colors = {
    primary: [16, 185, 129], // Emerald 500
    primaryDark: [6, 95, 70], // Emerald 800
    dark: [15, 23, 42],      // Slate 900
    text: [51, 65, 85],      // Slate 700
    textLight: [100, 116, 139], // Slate 500
    bg: [248, 250, 252],     // Slate 50
    border: [226, 232, 240], // Slate 200
    white: [255, 255, 255]
  };

  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);

  // Helper for rounded background
  const drawSectionBg = (y: number, height: number) => {
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(margin, y, contentWidth, height, 3, 3, 'FD');
  };

  // --- Header ---
  // Large colored header background
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 65, 'F');
  
  // Decorative circle overlay (subtle)
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.circle(pageWidth / 2, -20, 80, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // Process Logo
  let logoY = 15;
  try {
    const logoData = await loadRoundedImage(LOGO_URL);
    const logoSize = 24;
    const logoX = (pageWidth / 2) - (logoSize / 2);
    
    // White glow behind logo
    doc.setFillColor(255, 255, 255);
    doc.circle(pageWidth / 2, logoY + (logoSize/2), (logoSize/2) + 1, 'F');
    
    doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
    logoY += logoSize + 5;
  } catch (error) {
    console.error("Error loading logo", error);
    logoY += 10;
  }

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("LUA POWER GYM", pageWidth / 2, logoY + 6, { align: "center" });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(236, 253, 245); // Emerald 50
  doc.text("COMPROVANTE DE MATRÍCULA", pageWidth / 2, logoY + 14, { align: "center" });

  // --- Profile Section ---
  let cursorY = 85;

  // Avatar
  const avatarSize = 35;
  if (client.avatar) {
    try {
      const roundedAvatar = await loadRoundedImage(client.avatar);
      doc.addImage(roundedAvatar, 'PNG', margin, cursorY, avatarSize, avatarSize);
      
      // Draw a subtle circle border
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.5);
      doc.circle(margin + avatarSize/2, cursorY + avatarSize/2, avatarSize/2, 'S');
    } catch (e) {
      console.error("Failed to process avatar", e);
      // Fallback to square if processing fails
      try {
        doc.addImage(client.avatar, 'JPEG', margin, cursorY, avatarSize, avatarSize);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.rect(margin, cursorY, avatarSize, avatarSize);
      } catch (err) {
        // If everything fails, draw placeholder
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.circle(margin + avatarSize/2, cursorY + avatarSize/2, avatarSize/2, 'F');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.setFontSize(18);
        doc.text(client.name.charAt(0).toUpperCase(), margin + avatarSize/2, cursorY + avatarSize/2 + 2, { align: "center", baseline: "middle" });
      }
    }
  } else {
    // Placeholder Circle
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.circle(margin + avatarSize/2, cursorY + avatarSize/2, avatarSize/2, 'FD');
    
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(client.name.charAt(0).toUpperCase(), margin + avatarSize/2, cursorY + avatarSize/2 + 2, { align: "center", baseline: "middle" });
  }

  // Name & Contact
  const textLeft = margin + avatarSize + 12;
  
  // Label: ALUNO
  doc.setFontSize(8);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.setFont("helvetica", "bold");
  doc.text("ALUNO(A)", textLeft, cursorY + 5);

  // Name
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(client.name, textLeft, cursorY + 14);

  // Phone
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(client.phone, textLeft, cursorY + 22);

  // Status Pill (Top Right relative to profile)
  let statusColor = [100, 116, 139]; 
  if (statusData.status === UserStatus.ACTIVE) statusColor = colors.primary;
  if (statusData.status === UserStatus.WARNING) statusColor = [245, 158, 11]; // Amber
  if (statusData.status === UserStatus.EXPIRED) statusColor = [239, 68, 68]; // Red
  if (statusData.status === UserStatus.PENDING_PAYMENT) statusColor = [59, 130, 246]; // Blue

  const pillWidth = 35;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - pillWidth, cursorY, pillWidth, 8, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusData.label.toUpperCase(), pageWidth - margin - pillWidth/2, cursorY + 5, { align: "center" });

  cursorY += 50;

  // --- Plan Details Section ---
  const planHeight = 65; 
  drawSectionBg(cursorY, planHeight);

  // Section Label
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 6, cursorY + 10, 2, 'F'); 
  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DETALHES DO PLANO", margin + 12, cursorY + 11);

  // Divider
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.line(margin + 5, cursorY + 16, pageWidth - margin - 5, cursorY + 16);

  const rowStart = cursorY + 28;
  const col1 = margin + 10;
  const col2 = margin + 70;
  const col3 = margin + 130;
  
  const drawField = (label: string, val: string, x: number, y: number, highlight = false) => {
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x, y);
    
    doc.setFontSize(12);
    if (highlight) doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    else doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont("helvetica", "bold");
    doc.text(val, x, y + 6);
  };

  drawField("Data Início", formatDate(client.startDate), col1, rowStart);
  drawField("Duração", `${client.durationDays} Dias`, col2, rowStart);
  drawField("Vencimento", formatDate(client.expiryDate), col3, rowStart, true);
  
  // Amount Field
  const formattedAmount = client.amount 
    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(client.amount) 
    : '0,00 Kz';
  
  drawField("Valor Pago", formattedAmount, col1, rowStart + 18);

  cursorY += planHeight + 10;

  // --- Enrolled Classes Section ---
  if (client.enrolledClasses && client.enrolledClasses.length > 0) {
    const classRowHeight = 8;
    const headerHeight = 20;
    const classesBoxHeight = headerHeight + (client.enrolledClasses.length * classRowHeight) + 5;
    
    // Check if we need a new page (unlikely for classes but safe to check)
    if (cursorY + classesBoxHeight > 270) {
        doc.addPage();
        cursorY = 20;
    }

    drawSectionBg(cursorY, classesBoxHeight);

    // Header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 6, cursorY + 10, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont("helvetica", "bold");
    doc.text("MODALIDADES", margin + 12, cursorY + 11);

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(margin + 5, cursorY + 16, pageWidth - margin - 5, cursorY + 16);

    let classY = cursorY + 24;
    client.enrolledClasses.forEach((cls) => {
        doc.setFontSize(10);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.setFont("helvetica", "bold");
        doc.text(cls.name, margin + 10, classY);

        doc.setFont("helvetica", "normal");
        const priceStr = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(cls.price);
        doc.text(priceStr, pageWidth - margin - 10, classY, { align: "right" });
        
        classY += classRowHeight;
    });

    cursorY += classesBoxHeight + 10;
  }


  // --- Notes Section ---
  if (client.notes && client.notes.trim().length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(client.notes, contentWidth - 20);
    const notesContentHeight = splitNotes.length * 5;
    const notesBoxHeight = notesContentHeight + 30; // padding
    
    if (cursorY + notesBoxHeight > 270) {
      doc.addPage();
      cursorY = 20;
    }

    drawSectionBg(cursorY, notesBoxHeight);

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 6, cursorY + 10, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES", margin + 12, cursorY + 11);

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(margin + 5, cursorY + 16, pageWidth - margin - 5, cursorY + 16);

    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont("helvetica", "normal");
    doc.text(splitNotes, margin + 10, cursorY + 25);
    
    cursorY += notesBoxHeight + 10;
  }

  // --- Footer ---
  const footerY = 285;
  doc.setFontSize(8);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text(`Lua Power GYM • Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, footerY, { align: "center" });

  const timestamp = new Date().getTime();
  const safeName = client.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  doc.save(`gym_comprovante_${safeName}_${timestamp}.pdf`);
};

export const generateClientListPDF = async (clients: User[]) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  
  // -- HEADER --
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Try load logo
  try {
     const logoData = await loadRoundedImage(LOGO_URL);
     doc.addImage(logoData, 'PNG', 15, 8, 24, 24);
  } catch(e) {}

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE ALUNOS", 45, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} • Total: ${clients.length} Alunos`, 45, 26);

  // -- TABLE HEADER --
  let y = 50;
  const col = { name: 15, phone: 75, expiry: 110, status: 145, value: 175 };
  
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(10, y-5, 190, 10, 'F');
  
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("NOME", col.name, y);
  doc.text("TELEFONE", col.phone, y);
  doc.text("VENCIMENTO", col.expiry, y);
  doc.text("STATUS", col.status, y);
  doc.text("VALOR", col.value, y);

  y += 10;

  // -- ROWS --
  let totalRevenue = 0;
  
  clients.forEach((client, index) => {
    // Add page if needed
    if (y > 270) {
      doc.addPage();
      y = 20;
      // Re-draw header on new page (Simplified)
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("NOME", col.name, y);
      doc.text("TELEFONE", col.phone, y);
      doc.text("VENCIMENTO", col.expiry, y);
      doc.text("STATUS", col.status, y);
      doc.text("VALOR", col.value, y);
      y += 10;
    }

    const statusData = getUserStatus(client);
    const amount = 0; // TODO: Get amount from plan
    
    // Sum revenue only if active
    if (statusData.status === UserStatus.ACTIVE) {
        totalRevenue += amount;
    }

    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(client.name.length > 25 ? client.name.substring(0, 22) + '...' : client.name, col.name, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(client.phone || '', col.phone, y);
    doc.text(formatDate(client.subscription_end_date), col.expiry, y);
    
    // Status Color
    if (statusData.status === UserStatus.ACTIVE) doc.setTextColor(16, 185, 129);
    else if (statusData.status === UserStatus.WARNING) doc.setTextColor(245, 158, 11);
    else if (statusData.status === UserStatus.PENDING_PAYMENT) doc.setTextColor(59, 130, 246);
    else doc.setTextColor(239, 68, 68);
    
    doc.setFont("helvetica", "bold");
    doc.text(statusData.label, col.status, y);
    
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    const valStr = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(amount).replace('Kz', '').trim();
    doc.text(valStr, col.value, y);

    // Line separator
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(10, y + 4, 200, y + 4);
    
    y += 12;
  });

  // -- FOOTER TOTALS --
  if (y > 250) { doc.addPage(); y = 20; }
  else y += 10;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, y, 80, 25, 3, 3, 'F');
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RECEITA ATIVA (ESTIMADA)", 125, y+8);
  
  const totalStr = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalRevenue);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(16);
  doc.text(totalStr, 125, y+18);
  
  doc.save(`gym_lista_alunos_${new Date().toISOString().split('T')[0]}.pdf`);
};