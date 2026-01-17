import { Image } from 'react-native';

export default async function getSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        reject(error);
      },
    );
  });
}

export const getImageUrl = (uri: string | null | undefined) => {
  // Handle null, undefined, or empty string
  if (!uri || typeof uri !== 'string') {
    return null;
  }

  // If uri already starts with http, return as-is (pełny URL z backend)
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // If it starts with /documents/, it's already a proper path
  if (uri.startsWith('/documents/')) {
    const fullUrl = `http://api.acmanager.usermd.net${uri}`;
    return fullUrl;
  }

  // Ensure URI starts with forward slash for other cases
  const normalizedUri = uri.startsWith('/') ? uri : `/${uri}`;

  // Otherwise, prepend the API base URL
  const fullUrl = `http://api.acmanager.usermd.net${normalizedUri}`;
  return fullUrl;
};
