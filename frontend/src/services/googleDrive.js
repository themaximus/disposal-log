// Direct browser <-> Google Drive media storage using the user's OAuth token.
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export const GOOGLE_DRIVE_CONNECT_URL = '/api/auth/google-drive';

export function extractDriveFileId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function uploadToGoogleDrive(file, accessToken) {
  const metadata = { name: file.name, mimeType: file.type || 'application/octet-stream' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error('Google Drive upload failed');

  // Make the file viewable by link so it can be embedded in cards.
  await fetch(`${DRIVE_FILES_URL}/${data.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  return `https://lh3.googleusercontent.com/d/${data.id}`;
}

export async function deleteDriveFiles(urls, accessToken) {
  if (!accessToken || !Array.isArray(urls)) return;
  for (const url of urls) {
    const fileId = extractDriveFileId(url);
    if (!fileId) continue;
    try {
      await fetch(`${DRIVE_FILES_URL}/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.error('Failed to delete Google Drive file:', fileId, e);
    }
  }
}
