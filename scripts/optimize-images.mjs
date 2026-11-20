/**
 * Convierte el material bruto de `fotos clinica/` y `tratamientos/` a WebP
 * en public/assets/img, con nombres en kebab-case sin acentos (SEO).
 *
 * Uso: npm run images
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'img');
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

/** Quita acentos y normaliza a kebab-case. */
const slug = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (IMAGE_RE.test(entry.name)) files.push(full);
  }
  return files;
}

/** Nombres explícitos para las fotos de instalaciones. */
const CLINIC_NAMES = {
  cartelretocado: 'clinica-cartel',
  recepcinretocada: 'clinica-recepcion',
  salamoradaretocada: 'clinica-sala-morada',
  salaverderetocada: 'clinica-sala-verde',
};

async function convert(source, targetName, maxWidth, quality) {
  const destination = path.join(OUT_DIR, `${targetName}.webp`);
  await mkdir(path.dirname(destination), { recursive: true });

  await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(destination);

  const { width, height } = await sharp(destination).metadata();

  return {
    src: `/assets/img/${targetName}.webp`,
    width: width ?? null,
    height: height ?? null,
    source: path.relative(ROOT, source).split(path.sep).join('/'),
  };
}

const manifest = [];

const clinicDir = path.join(ROOT, 'fotos clinica');
for (const file of await walk(clinicDir)) {
  const base = path.basename(file, path.extname(file));
  const key = slug(base).replace(/-/g, '');
  const name = CLINIC_NAMES[key] ?? `clinica-${slug(base)}`;
  manifest.push(await convert(file, name, 1800, 82));
}

const treatmentsDir = path.join(ROOT, 'tratamientos');
for (const file of await walk(treatmentsDir)) {
  const relative = path.relative(treatmentsDir, file).replace(/\.[^.]+$/, '');
  manifest.push(await convert(file, `tratamientos/${slug(relative)}`, 1200, 78));
}

const manifestPath = path.join(ROOT, 'src', 'data', 'images.json');
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(
  manifestPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), images: manifest }, null, 2),
  'utf8',
);

console.log(`Optimizadas ${manifest.length} imágenes en public/assets/img`);
