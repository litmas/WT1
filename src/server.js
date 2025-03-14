import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import homeRoutes from './routes/homeRoutes.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static(path.join(dirname, 'views')));

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.use('/', authRoutes);
app.use('/home', homeRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(dirname, 'views', 'index.html'));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening at http://localhost:${port}`);
});
