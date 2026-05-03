import 'dotenv/config';
import { buildVectorStore } from '../services/ragService';

async function main() {
    console.log('Building keyword index from documents...');
    await buildVectorStore();
    console.log('Done! Chunk store is ready for RAG queries.');
}

main().catch(console.error);
