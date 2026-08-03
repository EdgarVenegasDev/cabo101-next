// app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

// Comprime un video con el ffmpeg instalado en el sistema
// (sudo apt install ffmpeg -y). Se limita el ancho a 1280px (de sobra
// para un video de fondo/preview — no tiene sentido servir 4K para un
// <video> que en pantalla mide una fracción de eso), se re-codifica a
// H.264/AAC con un CRF razonable, y lo más importante: "+faststart"
// mueve el índice del archivo (moov atom) al inicio, para que el
// navegador pueda EMPEZAR a reproducir sin haber descargado el video
// completo. La mayoría de los videos que salen directo de un celular
// NO tienen esto, y es la causa más común de "el video tarda una
// eternidad en cargar" en la web.
async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", inputPath,
    // Nunca agranda un video más chico que 1280px; -2 en la altura
    // mantiene el aspect ratio y garantiza un número par (lo exige H.264).
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "27",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ]);
}

// Comprime una imagen con sharp: la reduce a un ancho máximo razonable
// (sin agrandar las que ya son más chicas) y la convierte a WebP, que a
// igual calidad visual suele pesar 25-35% menos que JPEG/PNG. Soporta
// GIFs animados (animated: true).
async function compressImage(buffer: Buffer, isAnimatedGif: boolean): Promise<Buffer> {
  return sharp(buffer, { animated: isAnimatedGif })
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const section = formData.get("section") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const maxSize = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB` },
        { status: 413 } // 413 Payload Too Large
      );
    }

    const isVideo = file.type.startsWith("video/");
    const ext = path.extname(file.name);
    const baseName = uuidv4();
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let finalFileName: string;

    if (isVideo) {
      // Se guarda primero el original en un archivo temporal; se intenta
      // comprimir a un archivo aparte; solo si todo sale bien se borra
      // el temporal. Si ffmpeg falla por cualquier motivo (no instalado,
      // archivo corrupto, etc.), se sube el original sin comprimir en
      // vez de romper la subida completa — mejor un video pesado que
      // ningún video.
      const tempFileName = `${baseName}-original${ext}`;
      const tempPath = path.join(uploadDir, tempFileName);
      await writeFile(tempPath, buffer);

      const compressedFileName = `${baseName}.mp4`;
      const compressedPath = path.join(uploadDir, compressedFileName);

      try {
        await compressVideo(tempPath, compressedPath);
        await unlink(tempPath);
        finalFileName = compressedFileName;
      } catch (ffmpegError) {
        console.error(
          "No se pudo comprimir el video (¿está instalado ffmpeg? -> sudo apt install ffmpeg -y). Se sube el original sin comprimir:",
          ffmpegError
        );
        finalFileName = tempFileName;
      }
    } else {
      // Misma lógica de respaldo: si sharp falla, se guarda el archivo
      // original tal cual, con su extensión real.
      try {
        const isGif = file.type === "image/gif";
        const optimizedBuffer = await compressImage(buffer, isGif);
        finalFileName = `${baseName}.webp`;
        await writeFile(path.join(uploadDir, finalFileName), optimizedBuffer);
      } catch (sharpError) {
        console.error(
          "No se pudo optimizar la imagen. Se sube el archivo original sin comprimir:",
          sharpError
        );
        finalFileName = `${baseName}${ext}`;
        await writeFile(path.join(uploadDir, finalFileName), buffer);
      }
    }

    const url = `/uploads/${finalFileName}`;
    return NextResponse.json({ url, fileName: finalFileName, section });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Error al subir: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}