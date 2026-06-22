import pptxgen from 'pptxgenjs';
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
        slide.background = { color: index === 0 ? 'F4F7FB' : 'FFFFFF' };
        slide.addText(slideData.title, {
            x: 0.65,
            y: index === 0 ? 1.25 : 0.45,
            w: 11.0,
            h: 0.6,
            fontSize: index === 0 ? 34 : 25,
            bold: true,
            color: '172033',
            margin: 0.05
        });
        if (slideData.content.length) {
            slide.addText(slideData.content.map((text) => ({ text, options: { bullet: { type: 'ul' } } })), {
                x: 0.9,
                y: index === 0 ? 2.25 : 1.35,
                w: 10.6,
                h: 4.25,
                fontSize: 18,
                color: '2F3A4F',
                breakLine: false,
                fit: 'shrink',
                valign: 'mid'
            });
        }
        if (slideData.speakerNotes) {
            slide.addNotes(slideData.speakerNotes);
        }
        slide.addText(`${index + 1}`, {
            x: 11.75,
            y: 6.85,
            w: 0.45,
            h: 0.25,
            fontSize: 9,
            color: '667085',
            align: 'right'
        });
    });
    return Buffer.from(await pptx.write({ outputType: 'arraybuffer' }));
}
