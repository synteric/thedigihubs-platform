import { apiFetch, apiUrl } from './api';

export type UploadedDocument = {
  name: string;
  type: string;
  size: number;
  category?: string;
  storageKey?: string;
  url?: string;
};

export async function uploadDocument(file: File, category?: string): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);

  const response = await apiFetch('/documents', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Unable to upload ${file.name}. Status ${response.status}.`);
  }

  const uploaded = await response.json() as UploadedDocument;
  const url = uploaded.url
    ? uploaded.url.startsWith('http')
      ? uploaded.url
      : apiUrl(uploaded.url)
    : undefined;

  return {
    ...uploaded,
    url,
  };
}
