export function load(fileName: string): Promise<Buffer> {
	const fs = require('fs');
	return new Promise((resolve, reject) => {
		fs.readFile(fileName, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	});
}

export function loadText(fileName: string, encoding = 'utf8'): Promise<string> {
	const fs = require('fs');
	return new Promise((resolve, reject) => {
		fs.readFile(fileName, encoding, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	});
}

export function loadJson<T>(fileName: string): Promise<T> {
	return loadText(fileName).then(JSON.parse);
}

export function isReadable(fileName: string): Promise<boolean> {
	const fs = require('fs');
	return new Promise((resolve, reject) => {
		fs.access(fileName, fs.R_OK, (err) => {
			err ? reject(err) : resolve();
		});
	});

}

export function getFileExtension(fileName: string): string {
	const path = require('path');
	return path.extname(fileName).toLowerCase();
}
