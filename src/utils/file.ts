import { ReadStream } from 'fs';
import { readFile } from 'fs/promises';

export async function loadText(
  fileName: string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> {
  const buf = await readFile(fileName, { encoding });
  return buf.toString();
}

export async function loadJson<T>(fileName: string): Promise<T> {
  const text = await loadText(fileName);
  return JSON.parse(text);
}

export async function readBinaryStream(stream: ReadStream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('readable', () => {
      const chunk = stream.read();
      if (chunk !== null) {
        chunks.push(chunk);
      }
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    stream.on('error', (e) => {
      reject(e);
    });
  });
}
