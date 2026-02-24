// scripts/generate-icons.mjs
// Genera todos los iconos PWA + favicon a partir del SVG del logo del editor
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = join(__dirname, '..', 'public');

mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

/**
 * Genera el SVG del icono a un tamaño dado.
 * Fondo azul profundo + libro con pluma centrado.
 */
function buildSvg(size) {
  const pad = Math.round(size * 0.13);
  const iconSize = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  const s = iconSize / 48; // escala relativa al viewBox 48x48

  // Traducción para centrar el logo (viewBox original 0 0 48 48)
  const tx = cx - 24 * s;
  const ty = cy - 24 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fondo con gradiente -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1f3d"/>
      <stop offset="100%" stop-color="#060e1c"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Fondo redondeado -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>

  <!-- Resplandor central sutil -->
  <circle cx="${cx}" cy="${cy}" r="${Math.round(size * 0.38)}"
    fill="rgba(59,130,246,0.08)"/>

  <!-- Logo: libro + pluma escalado y centrado -->
  <g transform="translate(${tx}, ${ty}) scale(${s})"
     fill="none" stroke="url(#glow)" stroke-linecap="round" stroke-linejoin="round">
    <!-- Libro - tapa izquierda -->
    <path d="M8 40 L8 10 Q8 7 11 7 L26 7 Q26 12 21 14 L8 14" stroke-width="2.5"/>
    <!-- Libro - tapa derecha + base -->
    <path d="M26 7 L37 7 Q40 7 40 10 L40 40 L8 40 Q8 35 13 35 L40 35" stroke-width="2.5"/>
    <!-- Líneas de texto -->
    <line x1="16" y1="20" x2="32" y2="20" stroke-width="2" opacity="0.8"/>
    <line x1="16" y1="26" x2="32" y2="26" stroke-width="2" opacity="0.8"/>
    <line x1="16" y1="32" x2="24" y2="32" stroke-width="2" opacity="0.5"/>
    <!-- Pluma / punta -->
    <path d="M34 4 L44 14 L38 14 L30 8 Z" fill="url(#glow)" stroke="none" opacity="0.95"/>
  </g>
</svg>`;
}

async function generateIcons() {
  console.log('Generando iconos PWA personalizados...\n');
  for (const size of SIZES) {
    const svg = buildSvg(size);
    const outPath = join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Favicon 32x32 PNG (fallback para browsers sin soporte SVG)
  const favicon32 = buildSvg(32);
  await sharp(Buffer.from(favicon32)).png().toFile(join(PUBLIC_DIR, 'favicon-32x32.png'));
  console.log('  ✓ favicon-32x32.png');

  // Favicon SVG (escala perfecta en todos los tamaños, mejor opción para browsers modernos)
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1f3d"/>
      <stop offset="100%" stop-color="#060e1c"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#bg)"/>
  <circle cx="24" cy="24" r="18" fill="rgba(59,130,246,0.08)"/>
  <g fill="none" stroke="url(#glow)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 40 L8 10 Q8 7 11 7 L26 7 Q26 12 21 14 L8 14" stroke-width="2.5"/>
    <path d="M26 7 L37 7 Q40 7 40 10 L40 40 L8 40 Q8 35 13 35 L40 35" stroke-width="2.5"/>
    <line x1="16" y1="20" x2="32" y2="20" stroke-width="2" opacity="0.8"/>
    <line x1="16" y1="26" x2="32" y2="26" stroke-width="2" opacity="0.8"/>
    <line x1="16" y1="32" x2="24" y2="32" stroke-width="2" opacity="0.5"/>
    <path d="M34 4 L44 14 L38 14 L30 8 Z" fill="url(#glow)" stroke="none" opacity="0.95"/>
  </g>
</svg>`;
  writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');
  console.log('  ✓ favicon.svg');

  console.log('\n¡Iconos y favicons generados correctamente!');
}

generateIcons().catch(console.error);
