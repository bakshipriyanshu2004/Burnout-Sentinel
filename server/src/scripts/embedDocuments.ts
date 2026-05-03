/**
 * One-time script to embed all documents in server/src/data/documents/
 * and save the vector store to server/src/data/vectorstore/embeddings.json
 *
 * Usage:
 *   cd server
 *   npx ts-node src/scripts/embedDocuments.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { buildVectorStore } from '../services/ragService';

(async () => {
    console.log('Starting document embedding...');
    await buildVectorStore();
    console.log('Done! Vector store is ready for RAG queries.');
    process.exit(0);
})();
