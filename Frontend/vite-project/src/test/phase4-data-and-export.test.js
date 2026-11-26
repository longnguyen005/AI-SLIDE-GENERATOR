import { Buffer } from 'node:buffer';
import zlib from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../service/apiClient';
import { exportDeckPptxClient } from '../service/clientPptxExport';

function readZipEntries(buffer) {
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();

  for (let i = 0; i < totalEntries; i += 1) {
    const compressionMethod = buffer.readUInt16LE(cdOffset + 10);
    const compressedSize = buffer.readUInt32LE(cdOffset + 20);
    const nameLen = buffer.readUInt16LE(cdOffset + 28);
    const extraLen = buffer.readUInt16LE(cdOffset + 30);
    const commentLen = buffer.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);
    const fileName = buffer.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');

    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const content =
      compressionMethod === 8 ? zlib.inflateRawSync(compressedData) : Buffer.from(compressedData);

    entries.set(fileName, content);
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

describe('Phase 4 Frontend Data & Client PPTX Export', () => {
  let originalFetch;

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline demo mode'));
    await api.loginDemo();
    globalThis.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  it('persists deck theme in demoStore, preserves ready status on metadata-only updateDeck, and resets on topic/slideCount change', async () => {
    const { deck: created } = await api.createDeck({
      topic: 'Quantum Cryptography Readiness',
      tone: 'academic',
      slideCount: 4,
      theme: 'amber',
    });
    expect(created.theme).toBe('amber');

    const { deck: updatedReady } = await api.updateDeck('demo-deck-ready', {
      title: 'Renamed Ready Blueprint',
      theme: 'coral',
    });
    expect(updatedReady.title).toBe('Renamed Ready Blueprint');
    expect(updatedReady.theme).toBe('coral');
    expect(updatedReady.status).toBe('ready');

    const { deck: resetDraft } = await api.updateDeck('demo-deck-ready', {
      topic: 'Updated Structural Topic',
      slideCount: 6,
    });
    expect(resetDraft.status).toBe('draft');
    expect(resetDraft.theme).toBe('coral');
  });

  it('duplicates decks and slides in demoStore with 200-char safe Copy naming and 10-slide cap enforcement', async () => {
    const longTitle = `${'Enterprise Security Blueprint '.repeat(8)}`.slice(0, 198);
    await api.updateDeck('demo-deck-ready', { title: longTitle, theme: 'emerald' });

    const { deck: clonedDeck } = await api.duplicateDeck('demo-deck-ready');
    expect(clonedDeck._id).not.toBe('demo-deck-ready');
    expect(clonedDeck.title.length).toBeLessThanOrEqual(200);
    expect(clonedDeck.title.endsWith('(Copy)')).toBe(true);
    expect(clonedDeck.theme).toBe('emerald');
    expect(clonedDeck.status).toBe('ready');

    const { slides: clonedSlides } = await api.getSlides(clonedDeck._id);
    expect(clonedSlides).toHaveLength(5);
    expect(clonedSlides.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4, 5]);

    // Duplicate slide 2 right after slide 2 -> becomes slide 3
    const secondSlide = clonedSlides[1];
    const { slide: duplicatedSlide, slides: reorderedSlides } = await api.duplicateSlide(
      secondSlide._id
    );
    expect(duplicatedSlide.slideNumber).toBe(3);
    expect(duplicatedSlide.title).toContain('(Copy)');
    expect(reorderedSlides).toHaveLength(6);
    expect(reorderedSlides[2]._id).toBe(duplicatedSlide._id);
    expect(reorderedSlides[3]._id).toBe(clonedSlides[2]._id);

    // Duplicate 4 more times to reach 10 slides, then expect 11th to throw
    for (let i = 0; i < 4; i += 1) {
      await api.duplicateSlide(secondSlide._id);
    }
    await expect(api.duplicateSlide(secondSlide._id)).rejects.toThrow(/at most 10 slides/i);
  });

  it('exports theme-specific PPTX fills via api.exportPptx and exportDeckPptxClient for coral and amber palettes', async () => {
    await api.updateDeck('demo-deck-ready', { theme: 'coral' });
    const { blob } = await api.exportPptx('demo-deck-ready');
    const buffer = Buffer.from(await blob.arrayBuffer());
    const entries = readZipEntries(buffer);
    const xml = [1, 2, 3, 4, 5]
      .map((i) => entries.get(`ppt/slides/slide${i}.xml`).toString('utf8'))
      .join('\n');

    expect(xml).toMatch(/E11D48|BE123C/i);
    expect(xml).not.toMatch(/4338CA/i);

    const { deck } = await api.getDeck('demo-deck-ready');
    const { slides } = await api.getSlides('demo-deck-ready');
    const amberExport = await exportDeckPptxClient({ ...deck, theme: 'amber' }, slides);
    const amberEntries = readZipEntries(Buffer.from(await amberExport.blob.arrayBuffer()));
    const amberXml = amberEntries.get('ppt/slides/slide3.xml').toString('utf8');
    expect(amberXml).toMatch(/D97706|B45309/i);
  });
});
