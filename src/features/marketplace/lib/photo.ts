/**
 * Shrinks a phone photo in the browser before it's stored: the longest side
 * comes down to `max` pixels and it's saved as WebP (JPEG where WebP isn't
 * available), which keeps a listing to roughly 100 KB.
 */
export async function resizePhoto(file: Blob, max = 900): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = canvas.toDataURL("image/webp", 0.82)
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85)
}
