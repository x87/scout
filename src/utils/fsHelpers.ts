/**
 *
 * @param {string} fileName
 * @returns {Promise<T>}
 */
export function load(fileName: string): Promise<Buffer> {
    let fs = require('fs');
    return new Promise(function (resolve, reject) {
        fs.readFile(fileName, function (err, data) {
            err ? reject(err) : resolve(data);
        });
    });
}

/**
 *
 * @param {string} fileName
 * @returns {Promise<T>}
 */
export function isReadable(fileName: string): Promise<boolean> {
    let fs = require('fs');
    return new Promise(function (resolve, reject) {
        fs.access(fileName, fs.R_OK, function (err) {
            err ? reject(err) : resolve();
        });
    });

}

/**
 *
 * @param fileName
 * @returns {string}
 */
export function getFileExtension(fileName: string): string {
    let path = require('path');
    return path.extname(fileName).toLowerCase();
}
