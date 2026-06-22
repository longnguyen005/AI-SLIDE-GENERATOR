const tones = ['professional', 'academic', 'simple', 'persuasive'];
const languages = ['English', 'en'];
const layouts = ['title', 'content', 'two_column', 'section', 'summary'];
function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
export function validateCreateDeck(body) {
    if (!isRecord(body))
        return 'Body must be an object';
    if (!body.topic || typeof body.topic !== 'string')
        return 'Topic is required';
    if (!languages.includes(String(body.language || 'English')))
        return 'Language must be English or en';
    if (!tones.includes(String(body.tone)))
        return 'Tone is invalid';
    const slideCount = Number(body.slideCount);
    if (!Number.isInteger(slideCount) || slideCount < 1 || slideCount > 10) {
        return 'Slide count must be an integer between 1 and 10';
    }
    return null;
}
export function validateOutline(body) {
    if (!isRecord(body) || !Array.isArray(body.sections))
        return 'Outline sections are required';
    if (body.sections.length < 1 || body.sections.length > 10)
        return 'Outline must contain 1-10 sections';
    return null;
}
export function validateSlide(body) {
    if (!isRecord(body))
        return 'Body must be an object';
    if (body.title !== undefined && typeof body.title !== 'string')
        return 'Title must be text';
    if (body.content !== undefined && !Array.isArray(body.content))
        return 'Content must be an array';
    if (body.layout !== undefined && !layouts.includes(String(body.layout)))
        return 'Layout is invalid';
    return null;
}
export function validateReorder(body) {
    if (!isRecord(body) || !Array.isArray(body.slideIds))
        return 'slideIds array is required';
    return null;
}
export function validateRegenerate(body) {
    if (!isRecord(body))
        return 'Body must be an object';
    if (body.instruction !== undefined && typeof body.instruction !== 'string')
        return 'Instruction must be text';
    return null;
}
