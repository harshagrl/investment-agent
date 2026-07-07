import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runResearchAgent } from './agent/graph.js';


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Simple in-memory cache
// Key: lowercase company name, Value: { timestamp, data }
const cache = new Map();

app.post('/api/research', async (req, res) => {
  const { companyName } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: 'companyName is required' });
  }

  const normalizedName = companyName.trim().toLowerCase();

  // Check cache
  if (cache.has(normalizedName)) {
    console.log(`Cache hit for: ${normalizedName}`);
    return res.json(cache.get(normalizedName).data);
  }

  console.log(`Starting research for: ${companyName}`);

  try {
    const result = await runResearchAgent(companyName);

    // Save to cache
    cache.set(normalizedName, {
      timestamp: Date.now(),
      data: result
    });

    res.json(result);
  } catch (error) {
    console.error('Error during research:', error);
    res.status(500).json({ error: 'Research failed. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
