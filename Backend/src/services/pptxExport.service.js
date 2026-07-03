import pptxgen from 'pptxgenjs';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

function iconLabel(title = '') {
    const text = title.toLowerCase();
    if (text.includes('climate') || text.includes('emission') || text.includes('global'))
        return 'GLOBAL';
    if (text.includes('growth') || text.includes('metric') || text.includes('impact'))
        return 'IMPACT';
    if (text.includes('strategy') || text.includes('recommend') || text.includes('roadmap'))
        return 'PLAN';
    if (text.includes('risk') || text.includes('challenge'))
        return 'RISK';
    return 'AI';
}

function addBackground(pptx, slide) {
    slide.background = { color: 'FBFBFF' };

    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
        fill: { color: 'FBFBFF' },
        line: { color: 'FBFBFF', transparency: 100 }
    });

    slide.addShape(pptx.ShapeType.arc, {
        x: 11.78,
        y: -0.52,
        w: 1.88,
        h: 1.88,
        adjustPoint: 0.35,
        fill: { color: 'ECEAFF', transparency: 10 },
        line: { color: 'ECEAFF', transparency: 100 }
    });

    slide.addShape(pptx.ShapeType.arc, {
        x: 8.75,
        y: 6.68,
        w: 1.18,
        h: 1.18,
        adjustPoint: 0.35,
        fill: { color: 'FFFFFF', transparency: 100 },
        line: { color: 'D7D9F4', transparency: 15 }
    });

    slide.addShape(pptx.ShapeType.rect, {
        x: 0.52,
        y: 0.38,
        w: 0.72,
        h: 0.03,
        fill: { color: '4338CA' },
        line: { color: '4338CA', transparency: 100 }
    });

    slide.addShape(pptx.ShapeType.rect, {
        x: 1.24,
        y: 0.38,
        w: 0.48,
        h: 0.03,
        fill: { color: 'B7B0FF' },
        line: { color: 'B7B0FF', transparency: 100 }
    });
}

function addVisualPanel(pptx, slide, title) {
    const panel = { x: 10.15, y: 1.12, w: 2.72, h: 5.34 };

    slide.addShape(pptx.ShapeType.roundRect, {
        ...panel,
        rectRadius: 0.12,
        fill: { color: '172033' },
        line: { color: '232B46', transparency: 0 },
        shadow: { type: 'outer', color: '172033', opacity: 0.18, blur: 2, angle: 45, distance: 2 }
    });

    slide.addShape(pptx.ShapeType.arc, {
        x: panel.x + 0.22,
        y: panel.y + 0.68,
        w: 1.35,
        h: 1.35,
        adjustPoint: 0.35,
        fill: { color: '22D3EE', transparency: 58 },
        line: { color: '22D3EE', transparency: 100 }
    });

    slide.addShape(pptx.ShapeType.arc, {
        x: panel.x + 1.35,
        y: panel.y + 3.52,
        w: 1.55,
        h: 1.55,
        adjustPoint: 0.35,
        fill: { color: '14B8A6', transparency: 52 },
        line: { color: '14B8A6', transparency: 100 }
    });

    for (let i = 0; i < 7; i += 1) {
        slide.addShape(pptx.ShapeType.line, {
            x: panel.x + 0.28 + i * 0.34,
            y: panel.y,
            w: 0,
            h: panel.h,
            line: { color: 'FFFFFF', transparency: 88, width: 0.5 }
        });
        slide.addShape(pptx.ShapeType.line, {
            x: panel.x,
            y: panel.y + 0.32 + i * 0.48,
            w: panel.w,
            h: 0,
            line: { color: 'FFFFFF', transparency: 88, width: 0.5 }
        });
    }

    slide.addShape(pptx.ShapeType.roundRect, {
        x: panel.x + 0.9,
        y: panel.y + 2.22,
        w: 0.9,
        h: 0.82,
        rectRadius: 0.08,
        fill: { color: 'FFFFFF', transparency: 78 },
        line: { color: 'FFFFFF', transparency: 64 }
    });

    slide.addText(iconLabel(title), {
        x: panel.x + 0.92,
        y: panel.y + 2.48,
        w: 0.86,
        h: 0.2,
        align: 'center',
        bold: true,
        fontSize: 12,
        color: 'FFFFFF',
        margin: 0
    });

    [2.28, 1.85, 1.05].forEach((width, index) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: panel.x + 0.22,
            y: panel.y + 4.84 + index * 0.14,
            w: width,
            h: 0.06,
            rectRadius: 0.02,
            fill: { color: 'FFFFFF', transparency: 62 },
            line: { color: 'FFFFFF', transparency: 100 }
        });
    });
}

function addBulletCard(pptx, slide, text, index) {
    const y = 3.04 + index * 0.64;

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.75,
        y,
        w: 7.62,
        h: 0.52,
        rectRadius: 0.04,
        fill: { color: 'FFFFFF', transparency: 0 },
        line: { color: 'D9D8EA', transparency: 0 },
        shadow: { type: 'outer', color: '1F2340', opacity: 0.06, blur: 1, angle: 45, distance: 1 }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.88,
        y: y + 0.16,
        w: 0.24,
        h: 0.2,
        rectRadius: 0.03,
        fill: { color: '4F46E5' },
        line: { color: '4F46E5', transparency: 100 }
    });

    slide.addText(String(index + 1).padStart(2, '0'), {
        x: 0.9,
        y: y + 0.2,
        w: 0.2,
        h: 0.1,
        fontSize: 6,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        margin: 0
    });

    slide.addText(text, {
        x: 1.28,
        y: y + 0.1,
        w: 6.92,
        h: 0.32,
        fontSize: 14,
        color: '34384F',
        fit: 'shrink',
        breakLine: false,
        margin: 0.02
    });
}

function addFooter(slide, index) {
    slide.addText('DECKAI GENERATION', {
        x: 11.72,
        y: 7.1,
        w: 1.0,
        h: 0.12,
        fontSize: 6.5,
        color: 'FFFFFF',
        transparency: 28,
        bold: true,
        charSpace: 1.2,
        margin: 0,
        align: 'right'
    });

    slide.addText(`${index + 1}`, {
        x: 12.13,
        y: 6.92,
        w: 0.36,
        h: 0.16,
        fontSize: 8,
        color: '667085',
        align: 'right',
        margin: 0
    });
}

export async function buildPptx(deck, slides) {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'DeckAI';
    pptx.subject = deck.topic;
    pptx.title = deck.title;
    pptx.company = 'DeckAI';
    pptx.theme = {
        headFontFace: 'Aptos Display',
        bodyFontFace: 'Aptos',
        lang: 'en-US'
    };

    slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        const content = Array.isArray(slideData.content) ? slideData.content.slice(0, 5) : [];

        addBackground(pptx, slide);
        addVisualPanel(pptx, slide, slideData.title);

        slide.addText(`SLIDE ${index + 1}`, {
            x: 0.78,
            y: 1.58,
            w: 0.6,
            h: 0.2,
            fontSize: 8,
            bold: true,
            color: '4338CA',
            fill: { color: 'EEECFF' },
            margin: 0.05,
            align: 'center'
        });

        slide.addText(slideData.title, {
            x: 0.72,
            y: 1.92,
            w: 8.1,
            h: 0.92,
            fontSize: 29,
            bold: true,
            color: '111827',
            fit: 'shrink',
            margin: 0.02,
            breakLine: false
        });

        if (content.length) {
            content.forEach((text, bulletIndex) => addBulletCard(pptx, slide, String(text), bulletIndex));
        }

        if (slideData.speakerNotes) {
            slide.addNotes(slideData.speakerNotes);
        }

        addFooter(slide, index);
    });

    return Buffer.from(await pptx.write({ outputType: 'arraybuffer' }));
}
