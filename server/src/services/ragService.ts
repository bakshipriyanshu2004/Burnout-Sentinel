import fs from 'fs';
import path from 'path';

// Try to import pdf-parse, fall back gracefully if unavailable
let pdfParse: any = null;
try {
    pdfParse = require('pdf-parse');
} catch {
    console.warn('[RAG] pdf-parse not available. PDF files will be skipped.');
}

const DOCS_DIR = path.join(__dirname, '../data/documents');
const STORE_PATH = path.join(__dirname, '../data/vectorstore/embeddings.json');

interface Chunk {
    text: string;
    source: string;
    embedding: number[];
}

let vectorStore: Chunk[] = [];
let storeLoaded = false;

// ──────────────────────────────────────────────
// Embedding via Gemini text-embedding-004
// ──────────────────────────────────────────────
export async function embedText(text: string): Promise<number[]> {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] }
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Embedding API error: ${err}`);
    }

    const data = await response.json();
    return data.embedding.values as number[];
}

// ──────────────────────────────────────────────
// Cosine similarity
// ──────────────────────────────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
}

// ──────────────────────────────────────────────
// Text chunking (500 chars, 100 char overlap)
// ──────────────────────────────────────────────
function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end).trim());
        start += chunkSize - overlap;
    }
    return chunks.filter(c => c.length > 50); // skip tiny chunks
}

// ──────────────────────────────────────────────
// Load and embed all documents
// ──────────────────────────────────────────────
export async function buildVectorStore(): Promise<void> {
    console.log('[RAG] Building vector store from documents...');

    if (!fs.existsSync(DOCS_DIR)) {
        console.warn('[RAG] No documents directory found at:', DOCS_DIR);
        return;
    }

    const files = fs.readdirSync(DOCS_DIR);
    if (files.length === 0) {
        console.warn('[RAG] No documents found in documents directory. Place .txt or .pdf files there.');
        return;
    }

    const allChunks: Omit<Chunk, 'embedding'>[] = [];

    for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        let text = '';

        try {
            if (file.endsWith('.txt') || file.endsWith('.md')) {
                text = fs.readFileSync(filePath, 'utf-8');
            } else if (file.endsWith('.pdf') && pdfParse) {
                const buffer = fs.readFileSync(filePath);
                const parsed = await pdfParse(buffer);
                text = parsed.text;
            } else {
                console.log(`[RAG] Skipping unsupported file: ${file}`);
                continue;
            }

            const chunks = chunkText(text);
            chunks.forEach(chunk => allChunks.push({ text: chunk, source: file }));
            console.log(`[RAG] Loaded ${chunks.length} chunks from ${file}`);
        } catch (err) {
            console.error(`[RAG] Error reading ${file}:`, err);
        }
    }

    if (allChunks.length === 0) {
        console.warn('[RAG] No chunks extracted from documents.');
        return;
    }

    // Embed all chunks (batch with small delay to avoid rate limiting)
    const embedded: Chunk[] = [];
    for (let i = 0; i < allChunks.length; i++) {
        try {
            const embedding = await embedText(allChunks[i].text);
            embedded.push({ ...allChunks[i], embedding });
            if (i % 10 === 0) console.log(`[RAG] Embedded ${i + 1}/${allChunks.length} chunks...`);
            // Small delay to respect rate limits
            await new Promise(r => setTimeout(r, 100));
        } catch (err) {
            console.error(`[RAG] Failed to embed chunk ${i}:`, err);
        }
    }

    // Save to disk
    const storeDir = path.dirname(STORE_PATH);
    if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(embedded, null, 2));

    vectorStore = embedded;
    storeLoaded = true;
    console.log(`[RAG] Vector store built with ${embedded.length} chunks. Saved to disk.`);
}

// ──────────────────────────────────────────────
// Load existing vector store from disk
// ──────────────────────────────────────────────
export function loadVectorStore(): void {
    if (storeLoaded) return;
    if (fs.existsSync(STORE_PATH)) {
        try {
            vectorStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
            storeLoaded = true;
            console.log(`[RAG] Loaded ${vectorStore.length} chunks from disk.`);
        } catch (err) {
            console.error('[RAG] Failed to load vector store from disk:', err);
        }
    } else {
        console.warn('[RAG] No vector store on disk. Run buildVectorStore() after adding documents.');
    }
}

// ──────────────────────────────────────────────
// Retrieve top-K relevant chunks for a query
// ──────────────────────────────────────────────
export async function retrieveContext(query: string, topK = 4): Promise<string> {
    loadVectorStore();

    if (vectorStore.length === 0) {
        return ''; // No documents indexed yet
    }

    try {
        const queryEmbedding = await embedText(query);
        const scored = vectorStore.map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        }));

        scored.sort((a, b) => b.score - a.score);
        const topChunks = scored.slice(0, topK);

        return topChunks
            .map((c, i) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');
    } catch (err) {
        console.error('[RAG] Retrieval error:', err);
        return '';
    }
}
