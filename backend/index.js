import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import billRoutes from './routes/billRoutes.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', billRoutes);

// 404 handler untuk endpoint yang tidak dikenal
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Format JSON tidak valid.' });
  }

  console.error('[Server Error]', err);
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    error:
      statusCode === 500
        ? 'Terjadi kesalahan pada server.'
        : err.message || 'Permintaan tidak dapat diproses.',
  });
});

app.listen(PORT, () => {
  console.log(`Smart Split Bill API berjalan di http://localhost:${PORT}`);
});
