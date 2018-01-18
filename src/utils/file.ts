const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const readFile = promisify(fs.readFile);

export async function load(fileName: string): Promise<Buffer> {
	return await readFile(fileName);
}

export async function loadText(fileName: string, encoding: string = 'utf8'): Promise<string> {
	return await readFile(fileName, encoding);
}

export async function loadJson<T>(fileName: string): Promise<T> {
	const text = await loadText(fileName);
	return JSON.parse(text);
}

export function getFileExtension(fileName: string): string {
	return path.extname(fileName).toLowerCase();
}
