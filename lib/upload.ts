import {
  getInfoAsync,
  uploadAsync,
  FileSystemUploadType,
} from "expo-file-system/legacy";

/**
 * Uploads a local file to a presigned URL.
 *
 * Replaces `fetch(uri).blob()` piped into `fetch(url, { body: blob })`. That
 * reads the whole file into a JavaScript Blob and hands it to React Native's
 * networking layer, which is unreliable on Android for anything larger than a
 * small image — it surfaces as "Network Error" partway through a multi-megabyte
 * photo. iOS tolerates it, which is why listing uploads worked on iPhone and
 * failed on Android.
 *
 * `uploadAsync` streams the file from native code instead, so the bytes never
 * enter the JS heap. It also handles Android `content://` URIs, which `fetch`
 * does not read consistently.
 */
export async function putFileToUrl(
  uploadUrl: string,
  uri: string,
  contentType: string,
): Promise<void> {
  const res = await uploadAsync(uploadUrl, uri, {
    httpMethod: "PUT",
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Storage upload failed (${res.status})`);
  }
}

/**
 * Byte size of a local file, or undefined if it can't be read.
 *
 * Presign endpoints take the size to enforce their own limits, and previously
 * got it from the Blob. Returning undefined is safe: the backend only checks
 * the value when one is supplied.
 */
export async function fileSize(uri: string): Promise<number | undefined> {
  try {
    const info = await getInfoAsync(uri);
    return info.exists && !info.isDirectory ? info.size : undefined;
  } catch {
    return undefined;
  }
}
