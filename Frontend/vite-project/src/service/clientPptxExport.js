const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

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

function addLightCanvas(shapes, slide) {
  slide.background = { color: 'FBFBFF' };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: 'FBFBFF' },
    line: { color: 'FBFBFF', transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: 11.78,
    y: -0.52,
    w: 1.88,
    h: 1.88,
    adjustPoint: 0.35,
    fill: { color: 'ECEAFF', transparency: 10 },
    line: { color: 'ECEAFF', transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0.52,
    y: 0.38,
    w: 0.72,
    h: 0.04,
    fill: { color: '4338CA' },
    line: { color: '4338CA', transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 1.28,
    y: 0.38,
    w: 0.48,
    h: 0.04,
    fill: { color: 'A5B4FC' },
    line: { color: 'A5B4FC', transparency: 100 },
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

function addVisualPanel(shapes, slide, title) {
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
    fill: { color: '22D3EE', transparency: 58 },
    line: { color: '22D3EE', transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: panel.x + 1.25,
    y: panel.y + 3.55,
    w: 1.35,
    h: 1.35,
    adjustPoint: 0.35,
    fill: { color: '14B8A6', transparency: 52 },
    line: { color: '14B8A6', transparency: 100 },
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

function renderTitleSlide(shapes, slide, deck, slideData, content, index) {
  slide.background = { color: '0F172A' };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: '0F172A' },
    line: { color: '0F172A', transparency: 100 },
  });

  slide.addShape(shapes.arc, {
    x: 10.2,
    y: -1.1,
    w: 4.1,
    h: 4.1,
    adjustPoint: 0.35,
    fill: { color: '4338CA', transparency: 55 },
    line: { color: '4338CA', transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0.82,
    y: 0.82,
    w: 1.2,
    h: 0.06,
    fill: { color: '6366F1' },
    line: { color: '6366F1', transparency: 100 },
  });

  slide.addText('EXECUTIVE PRESENTATION', {
    x: 0.82,
    y: 1.05,
    w: 4.2,
    h: 0.28,
    fontSize: 10,
    bold: true,
    charSpace: 1.8,
    color: 'A5B4FC',
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
      color: '818CF8',
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

function renderSectionSlide(shapes, slide, slideData, content, index) {
  slide.background = { color: 'EEF2FF' };

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: 'EEF2FF' },
    line: { color: 'EEF2FF', transparency: 100 },
  });

  slide.addShape(shapes.rect, {
    x: 0,
    y: 0,
    w: 0.36,
    h: SLIDE_H,
    fill: { color: '4338CA' },
    line: { color: '4338CA', transparency: 100 },
  });

  slide.addText(`SECTION ${String(index + 1).padStart(2, '0')}`, {
    x: 0.92,
    y: 1.05,
    w: 2.2,
    h: 0.32,
    fontSize: 10,
    bold: true,
    charSpace: 1.5,
    color: '4338CA',
    fill: { color: 'E0E7FF' },
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
    color: '1E1B4B',
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
      line: { color: 'C7D2FE' },
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

function renderContentSlide(shapes, slide, slideData, content, index) {
  addLightCanvas(shapes, slide);
  addVisualPanel(shapes, slide, slideData.title);

  slide.addText(`SLIDE ${String(index + 1).padStart(2, '0')}`, {
    x: 0.75,
    y: 0.88,
    w: 1.15,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: '4338CA',
    fill: { color: 'EEECFF' },
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
      fill: { color: '4F46E5' },
      line: { color: '4F46E5', transparency: 100 },
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

function renderTwoColumnSlide(shapes, slide, slideData, content, index) {
  addLightCanvas(shapes, slide);

  slide.addText('TWO-COLUMN COMPARISON', {
    x: 0.72,
    y: 0.78,
    w: 2.6,
    h: 0.26,
    fontSize: 8.5,
    bold: true,
    color: '4338CA',
    fill: { color: 'EEECFF' },
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

  const columns = [
    {
      x: 0.72,
      header: 'COLUMN 01 • PRIMARY PERSPECTIVE',
      accent: '4F46E5',
      tint: 'EEF2FF',
      items: leftItems,
    },
    {
      x: 6.86,
      header: 'COLUMN 02 • COUNTERPART & GUARDRAILS',
      accent: '0D9488',
      tint: 'F0FDFA',
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

function renderSummarySlide(shapes, slide, slideData, content, index) {
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
    fill: { color: '4F46E5' },
    line: { color: '4F46E5', transparency: 100 },
  });

  slide.addText('KEY TAKEAWAYS & SUMMARY', {
    x: 0.78,
    y: 0.72,
    w: 3.1,
    h: 0.28,
    fontSize: 9,
    bold: true,
    charSpace: 1.2,
    color: '0F766E',
    fill: { color: 'CCFBF1' },
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
      fill: { color: '0F172A' },
      line: { color: '0F172A', transparency: 100 },
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

export async function exportDeckPptxClient(deck = {}, slides = []) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error('Deck has no slides to export');
  }

  const mod = await import('pptxgenjs');
  const PptxGenJS = mod.default || mod;
  const pptx = new PptxGenJS();
  const shapes = getShapes(pptx, PptxGenJS);

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
        renderTitleSlide(shapes, slide, deck, slideData, content, index);
        break;
      case 'section':
        renderSectionSlide(shapes, slide, slideData, content, index);
        break;
      case 'two_column':
        renderTwoColumnSlide(shapes, slide, slideData, content, index);
        break;
      case 'summary':
        renderSummarySlide(shapes, slide, slideData, content, index);
        break;
      case 'content':
      default:
        renderContentSlide(shapes, slide, slideData, content, index);
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
