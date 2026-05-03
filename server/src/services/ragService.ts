import fs from 'fs';
import path from 'path';

// pdf-parse exports PDFParse as a named class
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

const DOCS_DIR = path.join(__dirname, '../data/documents');
const STORE_PATH = path.join(__dirname, '../data/vectorstore/chunks.json');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Chunk {
    id: string;
    source: string;
    text: string;
    // Pre-computed term frequencies for fast retrieval
    terms: Record<string, number>;
}

let store: Chunk[] = [];
let storeLoaded = false;

// ─── Text Tokenizer ───────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);
}

function computeTermFreqs(tokens: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
    return freq;
}

// ─── BM25-style keyword scoring ───────────────────────────────────────────────
function scoreChunk(chunk: Chunk, queryTerms: string[]): number {
    let score = 0;
    const k1 = 1.5, b = 0.75;
    const avgLen = 300; // approximate average chunk length in tokens
    const chunkLen = Object.values(chunk.terms).reduce((a, b) => a + b, 0);

    for (const term of queryTerms) {
        const tf = chunk.terms[term] ?? 0;
        if (tf === 0) continue;
        const norm = tf * (k1 + 1) / (tf + k1 * (1 - b + b * chunkLen / avgLen));
        score += norm;
    }
    return score;
}

// ─── Load / Save Store ────────────────────────────────────────────────────────
export function loadVectorStore(): void {
    if (!fs.existsSync(STORE_PATH)) {
        console.log('[RAG] No chunk store on disk. Run buildVectorStore() after adding documents.');
        return;
    }
    try {
        store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
        storeLoaded = true;
        console.log(`[RAG] Loaded ${store.length} chunks from disk.`);
    } catch (e) {
        console.error('[RAG] Failed to load chunk store:', e);
    }
}

function saveStore(): void {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// ─── Build Vector Store (extract + chunk + index) ────────────────────────────
export async function buildVectorStore(): Promise<void> {
    console.log('[RAG] Building chunk store from documents...');

    if (!fs.existsSync(DOCS_DIR)) {
        fs.mkdirSync(DOCS_DIR, { recursive: true });
        console.log('[RAG] Created documents directory. Add PDF/TXT files and re-index.');
        return;
    }

    const files = fs.readdirSync(DOCS_DIR);
    const chunks: Chunk[] = [];

    for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        let text = '';

        try {
            if (file.endsWith('.txt') || file.endsWith('.md')) {
                text = fs.readFileSync(filePath, 'utf-8');
            } else if (file.endsWith('.pdf')) {
                const buffer = fs.readFileSync(filePath);
                const parser = new PDFParse({ data: buffer });
                const parsed = await parser.getText();
                text = parsed.text;
            } else {
                continue;
            }
            console.log(`[RAG] Processed: ${file} (${text.length} chars)`);
        } catch (err) {
            console.error(`[RAG] Error reading ${file}:`, err);
            continue;
        }

        // Chunk text into ~500-word blocks with 50-word overlap
        const words = text.split(/\s+/);
        const CHUNK_SIZE = 500;
        const OVERLAP = 50;

        for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
            const chunkWords = words.slice(i, i + CHUNK_SIZE);
            const chunkText = chunkWords.join(' ').trim();
            if (chunkText.length < 80) continue; // skip tiny chunks

            const tokens = tokenize(chunkText);
            chunks.push({
                id: `${file}__${i}`,
                source: file,
                text: chunkText,
                terms: computeTermFreqs(tokens),
            });
        }
    }

    if (chunks.length === 0) {
        console.log('[RAG] No chunks extracted from documents.');
        return;
    }

    store = chunks;
    storeLoaded = true;
    saveStore();
    console.log(`[RAG] ✅ Indexed ${chunks.length} chunks from ${files.length} file(s).`);
}

// ─── Retrieve Relevant Context ────────────────────────────────────────────────
export async function retrieveContext(query: string, topK = 4): Promise<string> {
    if (!storeLoaded || store.length === 0) return '';

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return '';

    const scored = store
        .map(chunk => ({ chunk, score: scoreChunk(chunk, queryTerms) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    if (scored.length === 0) return '';

    return scored
        .map(({ chunk }) => `[Source: ${chunk.source}]\n${chunk.text}`)
        .join('\n\n---\n\n');
}
