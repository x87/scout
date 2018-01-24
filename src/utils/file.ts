import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export async function loadText(fileName: string, encoding: string = 'utf8'): Promise<string> {
	return await readFile(fileName, encoding);
}

export async function loadJson<T>(fileName: string): Promise<T> {
	const text = await loadText(fileName);
	return JSON.parse(text);
}

export async function readBinaryStream(stream: fs.ReadStream): Promise<Buffer> {
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
