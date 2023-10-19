import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import DirectoryError from './errors/DirectoryError.js';
import FetchError from './errors/FetchError.js';

export type DownloadOptions = {
  /**
   * The directory to save the image to.
   *
   * If not provided, the current working directory will be used.
   */
  destination?: string;
  /**
   * The filename of the image.
   *
   * If not provided, the filename of the URL will be used.
   *
   * If the URL doesn't have a filename with extension, the current timestamp will be used.
   */
  filename?: string;
  /**
   * The extension of the image.
   *
   * If not provided, the extension of the URL will be used.
   *
   * If the URL doesn't have an extension, `.jpg` will be used.
   */
  extension?: string;
};

/**
 * Set the options with the default values if they are not provided.
 */
export function getDownloadOptions(url: string, options?: DownloadOptions) {
  let destination = options?.destination;
  if (!destination || destination === '') {
    destination = process.cwd();
  }

  let filename = options?.filename;
  if (!filename || filename === '') {
    if (path.extname(url) === '') {
      filename = `${Date.now()}`;
    } else {
      filename = path.basename(url, path.extname(url));
    }
  }

  let extension = options?.extension;
  if (!extension || extension === '') {
    if (path.extname(url) === '') {
      extension = '.jpg';
    } else {
      extension = path.extname(url);
    }
  }

  return { destination, filename, extension };
}

/**
 * Downloads an image from a URL.
 * @param url The URL of the image to download.
 * @param options The options to use.
 * @returns The file path.
 * @throws {DirectoryError} If the directory cannot be created.
 * @throws {FetchError} If the URL is invalid or the response is unsuccessful.
 */
export async function download(url: string, options: DownloadOptions = {}) {
  const { destination, filename, extension } = getDownloadOptions(url, options);

  try {
    // Create the directory if it doesn't exist.
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('EACCES')) {
        throw new DirectoryError(`Permission denied to create '${destination}'`);
      }
      throw new DirectoryError(error.message);
    } else {
      throw new DirectoryError(`Failed to create '${destination}'`);
    }
  }

  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    if (error instanceof Error) {
      throw new FetchError(error.message);
    } else {
      throw new FetchError('Failed to fetch image');
    }
  }

  if (!response.ok) {
    throw new FetchError(`Unsuccessful response: ${response.status} ${response.statusText}`);
  }

  if (response.body === null) {
    throw new FetchError('Response body is null');
  }

  // Ensure the response is an image
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.startsWith('image/')) {
    throw new FetchError('The response is not an image.');
  }

  const filePath = path.join(destination, `${filename}${extension}`);
  try {
    await pipeline(response.body, fs.createWriteStream(filePath));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('EACCES')) {
        throw new DirectoryError(`Permission denied to save image in '${destination}'`);
      }
      throw new DirectoryError(error.message);
    } else {
      throw new DirectoryError(`Failed to save image in '${destination}'`);
    }
  }

  return filePath;
}