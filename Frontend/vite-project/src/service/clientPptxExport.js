import {
  extractSharedColumnHeaders,
  parseMetricBullet,
  parseTimelineBullet,
} from '../constants/slideLayouts';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const PPTX_PALETTES = {
  indigo: {
    canvasBg: 'FBFBFF',
    canvasArc: 'ECEAFF',
    primary: '4F46E5',
    primaryDark: '4338CA',
    primaryLight: 'A5B4FC',
    primaryTint: 'EEF2FF',
    primaryBadgeBg: 'EEECFF',
    sectionBg: 'EEF2FF',
    sectionBadgeBg: 'E0E7FF',
    sectionTitle: '1E1B4B',
    sectionCardBorder: 'C7D2FE',
    titleBg: '0F172A',
    titleArc: '4338CA',
    titleBar: '6366F1',
    titleEyebrow: 'A5B4FC',
    titleNum: '818CF8',
    secondary: '0D9488',
    secondaryDark: '0F766E',
    secondaryTint: 'F0FDFA',
    secondaryBadgeBg: 'CCFBF1',
    visualGlow1: '22D3EE',
    visualGlow2: '14B8A6',
  },
  emerald: {
    canvasBg: 'F8FEFC',
    canvasArc: 'D1FAE5',
    primary: '0D9488',
    primaryDark: '0F766E',
    primaryLight: '5EEAD4',
    primaryTint: 'ECFDF5',
    primaryBadgeBg: 'CCFBF1',
    sectionBg: 'ECFDF5',
    sectionBadgeBg: 'D1FAE5',
    sectionTitle: '064E3B',
    sectionCardBorder: '99F6E4',
    titleBg: '062822',
    titleArc: '0F766E',
    titleBar: '10B981',
    titleEyebrow: '6EE7B7',
    titleNum: '34D399',
    secondary: '0284C7',
    secondaryDark: '0369A1',
    secondaryTint: 'F0F9FF',
    secondaryBadgeBg: 'E0F2FE',
    visualGlow1: '10B981',
    visualGlow2: '0EA5E9',
  },
  amber: {
    canvasBg: 'FFFDF9',
    canvasArc: 'FEF3C7',
    primary: 'D97706',
    primaryDark: 'B45309',
    primaryLight: 'FCD34D',
    primaryTint: 'FFFBEB',
    primaryBadgeBg: 'FEF3C7',
    sectionBg: 'FFFBEB',
    sectionBadgeBg: 'FDE68A',
    sectionTitle: '451A03',
    sectionCardBorder: 'FCD34D',
    titleBg: '1C1917',
    titleArc: 'B45309',
    titleBar: 'F59E0B',
    titleEyebrow: 'FCD34D',
    titleNum: 'FBBF24',
    secondary: '0F766E',
    secondaryDark: '115E59',
    secondaryTint: 'F0FDFA',
    secondaryBadgeBg: 'CCFBF1',
    visualGlow1: 'F59E0B',
    visualGlow2: 'EA580C',
  },
  coral: {
    canvasBg: 'FFFBFB',
    canvasArc: 'FFE4E6',
    primary: 'E11D48',
    primaryDark: 'BE123C',
    primaryLight: 'FDA4AF',
    primaryTint: 'FFF1F2',
    primaryBadgeBg: 'FFE4E6',
    sectionBg: 'FFF1F2',
    sectionBadgeBg: 'FECDD3',
    sectionTitle: '4C0519',
    sectionCardBorder: 'FDA4AF',
    titleBg: '181118',
    titleArc: 'BE123C',
    titleBar: 'F43F5E',
    titleEyebrow: 'FDA4AF',
    titleNum: 'FB7185',
    secondary: '0F766E',
    secondaryDark: '115E59',
    secondaryTint: 'F0FDFA',
    secondaryBadgeBg: 'CCFBF1',
    visualGlow1: 'F43F5E',
    visualGlow2: 'FB923C',
  },
};

export function resolveClientPptxPalette(theme = 'indigo') {
  const key = String(theme || 'indigo').trim().toLowerCase();
  return PPTX_PALETTES[key] || PPTX_PALETTES.indigo;
}

function fileSafe(value = '') {
  return (
    String(value)
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'deck'
  );
}

function iconLabel(title = '') {
  const text = String(title).toLowerCase();
  if (text.includes('climate') || text.includes('emission') || text.includes('global')) {
    return 'GLOBAL';
  }
  if (text.includes('growth') || text.includes('metric') || text.includes('impact')) {
    return 'IMPACT';
  }
  if (text.includes('strategy') || text.includes('recommend') || text.includes('roadmap')) {
    return 'PLAN';
  }
  if (text.includes('risk') || text.includes('challenge') || text.includes('security')) {
    return 'TRUST';
  }
  return 'AI';
}

function getShapes(pptx, PptxGenJS) {
  return (
    pptx.ShapeType ||
    PptxGenJS.ShapeType || {
      rect: 'rect',
      roundRect: 'roundRect',
      arc: 'arc',
    }
  );
}

function addLightCanvas(shapes, slide, palette) {
  slide.background = { color: palette.canvasBg };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: palette.canvasBg },
    line: { color: palette.canvasBg, transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: 11.78,
    y: -0.52,
    w: 1.88,
    h: 1.88,
    adjustPoint: 0.35,
    fill: { color: palette.canvasArc, transparency: 10 },
    line: { color: palette.canvasArc, transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0.52,
    y: 0.38,
    w: 0.72,
    h: 0.04,
    fill: { color: palette.primaryDark },
    line: { color: palette.primaryDark, transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 1.28,
    y: 0.38,
    w: 0.48,
    h: 0.04,
    fill: { color: palette.primaryLight },
    line: { color: palette.primaryLight, transparency: 100 },
  });
}

function addFooter(slide, index, dark = false) {
  slide.addText('DECKAI GENERATION', {
    x: 9.8,
    y: 7.05,
    w: 2.3,
    h: 0.2,
    fontSize: 7.5,
    color: dark ? '94A3B8' : '64748B',
    bold: true,
    charSpace: 1.2,
    margin: 0,
    align: 'right',
  });

  slide.addText(String(index + 1).padStart(2, '0'), {
    x: 12.25,
    y: 7.02,
    w: 0.48,
    h: 0.22,
    fontSize: 8.5,
    bold: true,
    color: dark ? 'E2E8F0' : '475569',
    align: 'right',
    margin: 0,
  });
}

function addVisualPanel(shapes, slide, title, palette) {
  const panel = { x: 10.15, y: 1.12, w: 2.66, h: 5.45 };

  slide.addShape(shapes.roundRect, {
    ...panel,
    rectRadius: 0.12,
    fill: { color: '172033' },
    line: { color: '232B46', transparency: 0 },
    shadow: { type: 'outer', color: '172033', opacity: 0.16, blur: 2, angle: 45, distance: 2 },
  });

  slide.addShape(shapes.arc, {
    x: panel.x + 0.22,
    y: panel.y + 0.68,
    w: 1.32,
    h: 1.32,
    adjustPoint: 0.35,
    fill: { color: palette.visualGlow1, transparency: 58 },
    line: { color: palette.visualGlow1, transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: panel.x + 1.25,
    y: panel.y + 3.55,
    w: 1.35,
    h: 1.35,
    adjustPoint: 0.35,
    fill: { color: palette.visualGlow2, transparency: 52 },
    line: { color: palette.visualGlow2, transparency: 100 },
  });

  slide.addShape(shapes.roundRect, {
    x: panel.x + 0.85,
    y: panel.y + 2.22,
    w: 0.96,
    h: 0.82,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF', transparency: 78 },
    line: { color: 'FFFFFF', transparency: 64 },
  });

  slide.addText(iconLabel(title), {
    x: panel.x + 0.85,
    y: panel.y + 2.48,
    w: 0.96,
    h: 0.24,
    align: 'center',
    bold: true,
    fontSize: 11,
    color: 'FFFFFF',
    margin: 0,
  });
}

function renderTitleSlide(shapes, slide, deck, slideData, content, index, palette) {
  slide.background = { color: palette.titleBg };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: palette.titleBg },
    line: { color: palette.titleBg, transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: 10.2,
    y: -1.1,
    w: 4.1,
    h: 4.1,
    adjustPoint: 0.35,
    fill: { color: palette.titleArc, transparency: 55 },
    line: { color: palette.titleArc, transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0.82,
    y: 0.82,
    w: 1.2,
    h: 0.06,
    fill: { color: palette.titleBar },
    line: { color: palette.titleBar, transparency: 100 },
  });

  slide.addText('EXECUTIVE PRESENTATION', {
    x: 0.82,
    y: 1.05,
    w: 4.2,
    h: 0.28,
    fontSize: 10,
    bold: true,
    charSpace: 1.8,
    color: palette.titleEyebrow,
    margin: 0,
  });

  slide.addText(String(slideData.title || deck.title || 'Untitled Presentation'), {
    x: 0.82,
    y: 1.48,
    w: 11.2,
    h: 1.65,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  slide.addText(String(deck.topic || deck.title || ''), {
    x: 0.82,
    y: 3.25,
    w: 10.4,
    h: 0.45,
    fontSize: 14,
    color: '94A3B8',
    breakLine: true,
    margin: 0.02,
  });

  content.slice(0, 4).forEach((bullet, bulletIndex) => {
    const y = 3.98 + bulletIndex * 0.68;
    slide.addShape(shapes.roundRect, {
      x: 0.82,
      y,
      w: 11.4,
      h: 0.56,
      rectRadius: 0.06,
      fill: { color: '1E293B' },
      line: { color: '334155' },
    });

    slide.addText(String(bulletIndex + 1).padStart(2, '0'), {
      x: 0.98,
      y: y + 0.14,
      w: 0.36,
      h: 0.28,
      fontSize: 9,
      bold: true,
      color: palette.titleNum,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    slide.addText(String(bullet), {
      x: 1.44,
      y: y + 0.08,
      w: 10.6,
      h: 0.4,
      fontSize: 13,
      color: 'F1F5F9',
      valign: 'middle',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, true);
}

function renderSectionSlide(shapes, slide, slideData, content, index, palette) {
  slide.background = { color: palette.sectionBg };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: palette.sectionBg },
    line: { color: palette.sectionBg, transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: 0.36,
    h: SLIDE_H,
    fill: { color: palette.primaryDark },
    line: { color: palette.primaryDark, transparency: 100 },
  });

  slide.addText(`SECTION ${String(index + 1).padStart(2, '0')}`, {
    x: 0.92,
    y: 1.05,
    w: 2.2,
    h: 0.32,
    fontSize: 10,
    bold: true,
    charSpace: 1.5,
    color: palette.primaryDark,
    fill: { color: palette.sectionBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Section Overview'), {
    x: 0.92,
    y: 1.62,
    w: 11.4,
    h: 1.45,
    fontSize: 32,
    bold: true,
    color: palette.sectionTitle,
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  content.slice(0, 4).forEach((bullet, bulletIndex) => {
    const y = 3.42 + bulletIndex * 0.78;
    slide.addShape(shapes.roundRect, {
      x: 0.92,
      y,
      w: 11.4,
      h: 0.64,
      rectRadius: 0.06,
      fill: { color: 'FFFFFF' },
      line: { color: palette.sectionCardBorder },
    });

    slide.addText(String(bullet), {
      x: 1.18,
      y: y + 0.1,
      w: 10.9,
      h: 0.44,
      fontSize: 14,
      color: '1E293B',
      valign: 'middle',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, false);
}

function renderContentSlide(shapes, slide, slideData, content, index, palette) {
  addLightCanvas(shapes, slide, palette);
  addVisualPanel(shapes, slide, slideData.title, palette);

  slide.addText(`SLIDE ${String(index + 1).padStart(2, '0')}`, {
    x: 0.75,
    y: 0.88,
    w: 1.15,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: palette.primaryDark,
    fill: { color: palette.primaryBadgeBg },
    margin: 0.04,
    align: 'center',
    valign: 'middle',
  });

  slide.addText(String(slideData.title || 'Key Insights'), {
    x: 0.75,
    y: 1.28,
    w: 8.95,
    h: 1.1,
    fontSize: 27,
    bold: true,
    color: '111827',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  content.slice(0, 5).forEach((text, bulletIndex) => {
    const y = 2.62 + bulletIndex * 0.78;

    slide.addShape(shapes.roundRect, {
      x: 0.75,
      y,
      w: 8.95,
      h: 0.66,
      rectRadius: 0.05,
      fill: { color: 'FFFFFF' },
      line: { color: 'D9D8EA' },
      shadow: { type: 'outer', color: '1F2340', opacity: 0.05, blur: 1, angle: 45, distance: 1 },
    });

    slide.addShape(shapes.roundRect, {
      x: 0.9,
      y: y + 0.19,
      w: 0.3,
      h: 0.28,
      rectRadius: 0.04,
      fill: { color: palette.primary },
      line: { color: palette.primary, transparency: 100 },
    });

    slide.addText(String(bulletIndex + 1).padStart(2, '0'), {
      x: 0.9,
      y: y + 0.19,
      w: 0.3,
      h: 0.28,
      fontSize: 7.5,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    slide.addText(String(text), {
      x: 1.34,
      y: y + 0.08,
      w: 8.2,
      h: 0.5,
      fontSize: 13.5,
      color: '334155',
      valign: 'middle',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, false);
}

function renderTwoColumnSlide(shapes, slide, slideData, content, index, palette) {
  addLightCanvas(shapes, slide, palette);

  slide.addText('TWO-COLUMN COMPARISON', {
    x: 0.72,
    y: 0.78,
    w: 2.6,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: palette.primaryDark,
    fill: { color: palette.primaryBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Comparative Perspectives'), {
    x: 0.72,
    y: 1.18,
    w: 11.88,
    h: 0.98,
    fontSize: 26,
    bold: true,
    color: '0F172A',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  const midpoint = Math.max(1, Math.ceil(content.length / 2));
  const leftItems = content.slice(0, midpoint);
  const rightItems = content.slice(midpoint);
  const { leftHeader, rightHeader } = extractSharedColumnHeaders(leftItems, rightItems);

  const columns = [
    {
      x: 0.72,
      header: leftHeader,
      accent: palette.primary,
      tint: palette.primaryTint,
      items: leftItems,
    },
    {
      x: 6.86,
      header: rightHeader,
      accent: palette.secondary,
      tint: palette.secondaryTint,
      items: rightItems,
    },
  ];

  columns.forEach((col) => {
    slide.addShape(shapes.roundRect, {
      x: col.x,
      y: 2.34,
      w: 5.74,
      h: 4.42,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1' },
      shadow: { type: 'outer', color: '0F172A', opacity: 0.05, blur: 2, angle: 45, distance: 1 },
    });

    slide.addShape(shapes.rect, {
      x: col.x,
      y: 2.34,
      w: 5.74,
      h: 0.44,
      fill: { color: col.tint },
      line: { color: col.tint, transparency: 100 },
    });

    slide.addText(col.header, {
      x: col.x + 0.22,
      y: 2.42,
      w: 5.3,
      h: 0.28,
      fontSize: 9,
      bold: true,
      charSpace: 0.8,
      color: col.accent,
      valign: 'middle',
      margin: 0,
    });

    col.items.slice(0, 4).forEach((item, itemIdx) => {
      const itemY = 2.98 + itemIdx * 0.9;

      slide.addShape(shapes.roundRect, {
        x: col.x + 0.2,
        y: itemY + 0.12,
        w: 0.24,
        h: 0.24,
        rectRadius: 0.04,
        fill: { color: col.accent },
        line: { color: col.accent, transparency: 100 },
      });

      slide.addText(String(item), {
        x: col.x + 0.56,
        y: itemY,
        w: 4.98,
        h: 0.74,
        fontSize: 13,
        color: '1E293B',
        valign: 'middle',
        fit: 'shrink',
        breakLine: true,
        margin: 0.02,
      });
    });
  });

  addFooter(slide, index, false);
}

function renderSummarySlide(shapes, slide, slideData, content, index, palette) {
  slide.background = { color: 'F8FAFC' };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: 'F8FAFC' },
    line: { color: 'F8FAFC', transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.14,
    fill: { color: palette.primary },
    line: { color: palette.primary, transparency: 100 },
  });

  slide.addText('KEY TAKEAWAYS & SUMMARY', {
    x: 0.78,
    y: 0.72,
    w: 3.1,
    h: 0.28,
    fontSize: 9,
    bold: true,
    charSpace: 1.2,
    color: palette.secondaryDark,
    fill: { color: palette.secondaryBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Executive Summary & Next Steps'), {
    x: 0.78,
    y: 1.15,
    w: 11.75,
    h: 1.05,
    fontSize: 28,
    bold: true,
    color: '0F172A',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  content.slice(0, 5).forEach((item, bulletIndex) => {
    const y = 2.45 + bulletIndex * 0.84;

    slide.addShape(shapes.roundRect, {
      x: 0.78,
      y,
      w: 11.75,
      h: 0.7,
      rectRadius: 0.06,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1' },
      shadow: { type: 'outer', color: '0F172A', opacity: 0.05, blur: 1, angle: 45, distance: 1 },
    });

    slide.addShape(shapes.roundRect, {
      x: 0.96,
      y: y + 0.16,
      w: 1.18,
      h: 0.38,
      rectRadius: 0.04,
      fill: { color: palette.titleBg },
      line: { color: palette.titleBg, transparency: 100 },
    });

    slide.addText(`TAKEAWAY ${bulletIndex + 1}`, {
      x: 0.96,
      y: y + 0.16,
      w: 1.18,
      h: 0.38,
      fontSize: 7.5,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    slide.addText(String(item), {
      x: 2.32,
      y: y + 0.08,
      w: 10.02,
      h: 0.54,
      fontSize: 13.5,
      color: '1E293B',
      valign: 'middle',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, false);
}

function renderMetricsSlide(shapes, slide, slideData, content, index, palette) {
  addLightCanvas(shapes, slide, palette);

  slide.addText('KPI METRICS SCORECARD', {
    x: 0.75,
    y: 0.78,
    w: 2.5,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: palette.primaryDark,
    fill: { color: palette.primaryBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Key Performance Metrics'), {
    x: 0.75,
    y: 1.18,
    w: 11.8,
    h: 0.96,
    fontSize: 27,
    bold: true,
    color: '0F172A',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  const items = (content.length ? content : ['KPI 01 | Operational benchmark indicator']).slice(0, 4);
  const cols = items.length === 3 ? 3 : 2;
  const cardGap = 0.28;
  const totalW = 11.8;
  const cardW = (totalW - cardGap * (cols - 1)) / cols;
  const rows = Math.ceil(items.length / cols);
  const cardH = rows === 1 ? 3.8 : 2.05;

  items.forEach((raw, idx) => {
    const parsed = parseMetricBullet(raw, idx);
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = 0.75 + col * (cardW + cardGap);
    const y = 2.38 + row * (cardH + 0.26);

    slide.addShape(shapes.roundRect, {
      x,
      y,
      w: cardW,
      h: cardH,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1' },
      shadow: { type: 'outer', color: '0F172A', opacity: 0.05, blur: 2, angle: 45, distance: 1 },
    });

    slide.addShape(shapes.rect, {
      x,
      y,
      w: cardW,
      h: 0.08,
      fill: { color: idx % 2 === 0 ? palette.primary : palette.secondary },
      line: { color: idx % 2 === 0 ? palette.primary : palette.secondary, transparency: 100 },
    });

    slide.addText(String(parsed.value), {
      x: x + 0.28,
      y: y + 0.28,
      w: cardW - 0.56,
      h: 0.72,
      fontSize: 28,
      bold: true,
      color: idx % 2 === 0 ? palette.primaryDark : palette.secondaryDark,
      valign: 'middle',
      fit: 'shrink',
      margin: 0,
    });

    slide.addText(String(parsed.label), {
      x: x + 0.28,
      y: y + 1.08,
      w: cardW - 0.56,
      h: cardH - 1.28,
      fontSize: 13.5,
      color: '334155',
      valign: 'top',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, false);
}

function renderTimelineSlide(shapes, slide, slideData, content, index, palette) {
  addLightCanvas(shapes, slide, palette);

  slide.addText('EXECUTION ROADMAP & MILESTONES', {
    x: 0.75,
    y: 0.78,
    w: 3.1,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: palette.primaryDark,
    fill: { color: palette.primaryBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Phased Implementation Roadmap'), {
    x: 0.75,
    y: 1.18,
    w: 11.8,
    h: 0.96,
    fontSize: 27,
    bold: true,
    color: '0F172A',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  const items = (content.length ? content : ['Phase 1: Baseline scope and launch pilot']).slice(0, 4);
  const count = items.length;
  const gap = 0.24;
  const cardW = (11.8 - gap * Math.max(0, count - 1)) / count;

  slide.addShape(shapes.rect, {
    x: 0.95,
    y: 2.62,
    w: 11.4,
    h: 0.05,
    fill: { color: palette.primaryLight },
    line: { color: palette.primaryLight, transparency: 100 },
  });

  items.forEach((raw, idx) => {
    const parsed = parseTimelineBullet(raw, idx);
    const x = 0.75 + idx * (cardW + gap);

    slide.addShape(shapes.roundRect, {
      x,
      y: 2.42,
      w: 0.46,
      h: 0.42,
      rectRadius: 0.06,
      fill: { color: palette.primary },
      line: { color: palette.primary, transparency: 100 },
    });

    slide.addText(String(idx + 1).padStart(2, '0'), {
      x,
      y: 2.42,
      w: 0.46,
      h: 0.42,
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    slide.addShape(shapes.roundRect, {
      x,
      y: 3.04,
      w: cardW,
      h: 3.68,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1' },
      shadow: { type: 'outer', color: '0F172A', opacity: 0.05, blur: 2, angle: 45, distance: 1 },
    });

    slide.addText(String(parsed.stage), {
      x: x + 0.2,
      y: 3.24,
      w: cardW - 0.4,
      h: 0.46,
      fontSize: 11,
      bold: true,
      color: palette.primaryDark,
      valign: 'middle',
      fit: 'shrink',
      margin: 0,
    });

    slide.addText(String(parsed.detail), {
      x: x + 0.2,
      y: 3.8,
      w: cardW - 0.4,
      h: 2.7,
      fontSize: 13,
      color: '334155',
      valign: 'top',
      fit: 'shrink',
      breakLine: true,
      margin: 0.02,
    });
  });

  addFooter(slide, index, false);
}

function renderCalloutSlide(shapes, slide, slideData, content, index, palette) {
  addLightCanvas(shapes, slide, palette);

  slide.addText('EXECUTIVE THESIS SPOTLIGHT', {
    x: 0.75,
    y: 0.78,
    w: 2.9,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: palette.primaryDark,
    fill: { color: palette.primaryBadgeBg },
    align: 'center',
    valign: 'middle',
    margin: 0.04,
  });

  slide.addText(String(slideData.title || 'Core Strategic Thesis'), {
    x: 0.75,
    y: 1.18,
    w: 11.8,
    h: 0.92,
    fontSize: 27,
    bold: true,
    color: '0F172A',
    valign: 'top',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  const lead = content[0] || slideData.title || 'Anchor execution on measurable high-leverage priorities.';
  const pillars = content.slice(1, 4);

  slide.addShape(shapes.roundRect, {
    x: 0.75,
    y: 2.28,
    w: 11.8,
    h: pillars.length ? 1.88 : 3.9,
    rectRadius: 0.08,
    fill: { color: palette.primaryTint },
    line: { color: palette.sectionCardBorder },
  });

  slide.addShape(shapes.rect, {
    x: 0.75,
    y: 2.28,
    w: 0.14,
    h: pillars.length ? 1.88 : 3.9,
    fill: { color: palette.primary },
    line: { color: palette.primary, transparency: 100 },
  });

  slide.addText(String(lead), {
    x: 1.12,
    y: 2.48,
    w: 11.15,
    h: pillars.length ? 1.48 : 3.4,
    fontSize: 19,
    bold: true,
    color: '0F172A',
    valign: 'middle',
    fit: 'shrink',
    breakLine: true,
    margin: 0.02,
  });

  if (pillars.length > 0) {
    const gap = 0.26;
    const cardW = (11.8 - gap * Math.max(0, pillars.length - 1)) / pillars.length;
    pillars.forEach((pillar, idx) => {
      const x = 0.75 + idx * (cardW + gap);
      slide.addShape(shapes.roundRect, {
        x,
        y: 4.42,
        w: cardW,
        h: 2.32,
        rectRadius: 0.08,
        fill: { color: 'FFFFFF' },
        line: { color: 'CBD5E1' },
      });

      slide.addText(`PILLAR 0${idx + 1}`, {
        x: x + 0.22,
        y: 4.6,
        w: cardW - 0.44,
        h: 0.28,
        fontSize: 8.5,
        bold: true,
        charSpace: 1,
        color: palette.secondaryDark,
        margin: 0,
      });

      slide.addText(String(pillar), {
        x: x + 0.22,
        y: 4.96,
        w: cardW - 0.44,
        h: 1.58,
        fontSize: 13,
        color: '334155',
        valign: 'top',
        fit: 'shrink',
        breakLine: true,
        margin: 0.02,
      });
    });
  }

  addFooter(slide, index, false);
}

export async function exportDeckPptxClient(deck = {}, slides = []) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error('Deck has no slides to export');
  }

  const mod = await import('pptxgenjs');
  const PptxGenJS = mod.default || mod;
  const pptx = new PptxGenJS();
  const shapes = getShapes(pptx, PptxGenJS);
  const palette = resolveClientPptxPalette(deck?.theme);

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'DeckAI';
  pptx.subject = deck.topic || deck.title || 'DeckAI Presentation';
  pptx.title = deck.title || deck.topic || 'DeckAI Presentation';
  pptx.company = 'DeckAI';
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'en-US',
  };

  slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    const content = Array.isArray(slideData.content) ? slideData.content.slice(0, 6).map(String) : [];
    const layout = slideData.layout || 'content';

    switch (layout) {
      case 'title':
        renderTitleSlide(shapes, slide, deck, slideData, content, index, palette);
        break;
      case 'section':
        renderSectionSlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'two_column':
        renderTwoColumnSlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'metrics':
        renderMetricsSlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'timeline':
        renderTimelineSlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'callout':
        renderCalloutSlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'summary':
        renderSummarySlide(shapes, slide, slideData, content, index, palette);
        break;
      case 'content':
      default:
        renderContentSlide(shapes, slide, slideData, content, index, palette);
        break;
    }

    if (slideData.speakerNotes) {
      slide.addNotes(String(slideData.speakerNotes));
    }
  });

  const arrayBuffer = await pptx.write({ outputType: 'arraybuffer' });
  const blob = new Blob([arrayBuffer], { type: PPTX_MIME });
  const fileName = `${fileSafe(deck.title || deck.topic || 'deck')}-${Date.now()}.pptx`;

  return { blob, fileName };
}
