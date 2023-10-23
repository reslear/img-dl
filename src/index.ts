import { DEFAULT_NAME } from './constanta.js';
import { DownloadOptions, download } from './downloader.js';

export type Image = {
  /**
   * The URL of the image.
   */
  url: string;
  /**
   * The name of the image file, without the extension.
   */
  name: string;
  /**
   * The extension of the image without the dot. Example: `jpg`.
   */
  extension: string;
  /**
   * The directory to save the image to. Can be relative or absolute.
   */
  directory: string;
  /**
   * The original name of the image file, without the extension.
   */
  originalName?: string;
  /**
   * The original extension of the image file, without the dot. Example: `jpg`.
   */
  originalExtension?: string;
  /**
   * The absolute path of the image, including the directory, name, and extension.
   */
  path: string;
};

export type Options = Omit<DownloadOptions, 'name'> & {
  /**
   * The name of the image file.
   *
   * You also can provide a function that returns the name.
   * The function will be called with the original name, if it exists in the URL.
   *
   * The default value will be used if this value (or the function) returns an empty string.
   *
   * The default value will be the **original name** if it exists in the URL.
   * Otherwise, it will be **'image'**.
   *
   * When downloading multiple images, `-index` will be appended to the end of the name (suffix).
   * `index` will start from 1.
   */
  name?: string;
};

async function imgdl(url: string, options?: Options): Promise<Image>;
async function imgdl(url: string[], options?: Options): Promise<Image[]>;
async function imgdl(url: string | string[], options?: Options): Promise<Image | Image[]> {
  if (Array.isArray(url)) {
    return Promise.all(url.map((u, i) => download(u, {
      ...options,
      name: (ori) => `${options?.name ?? ori ?? DEFAULT_NAME}-${i + 1}`,
    })));
  }

  return download(url, options);
}

export default imgdl;
