import { deflateSync } from "node:zlib";

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

/**
 * Génère un PNG en dégradé vertical entre deux couleurs, sans aucune
 * dépendance externe — utile pour des photos d'annonces de démonstration
 * qui n'ont pas besoin d'appeler un service tiers.
 */
export function generateGradientPng(
  width: number,
  height: number,
  colorTop: [number, number, number],
  colorBottom: [number, number, number]
): Buffer {
  const rowSize = 1 + width * 3; // 1 octet de filtre + RGB par pixel
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const t = height <= 1 ? 0 : y / (height - 1);
    const r = Math.round(colorTop[0] + (colorBottom[0] - colorTop[0]) * t);
    const g = Math.round(colorTop[1] + (colorBottom[1] - colorTop[1]) * t);
    const b = Math.round(colorTop[2] + (colorBottom[2] - colorTop[2]) * t);

    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filtre "None"
    for (let x = 0; x < width; x++) {
      const offset = rowStart + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur de bits
  ihdr[9] = 2; // type couleur : RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
