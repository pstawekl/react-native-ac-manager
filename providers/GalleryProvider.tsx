import {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useApi from '../hooks/useApi';

type Photo = {
  id: number;
  instalacja: null;
  serwis: null;
  montaz: null;
  inspekcja: null;
  image: string;
  owner: number;
  klient: number;
  tags: number[];
};

export type PhotosResponse = {
  zdjecia: Photo[];
};

export type Tag = {
  id: number;
  name: string;
  created_date: string;
};

export type TagsResponse = {
  tag_list: Tag[];
};

type GalleryContext = {
  photos: Photo[] | null;
  tags: Tag[] | null;
  photosLoading: boolean;
  tagsLoading: boolean;
  getPhotos?: () => Promise<PhotosResponse | undefined>;
  getTags?: () => Promise<TagsResponse | undefined>;
  deletePhoto?: (photoId: number) => Promise<void>;
};

export const GalleryContext = createContext<GalleryContext>({
  photos: null,
  tags: null,
  photosLoading: false,
  tagsLoading: false,
});

export function GalleryProvider({ children }: { children: ReactElement }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [, setError] = useState<string | null>(null);

  const {
    result: photosResponse,
    execute: getPhotosRaw,
    loading: photosLoading,
  } = useApi<PhotosResponse>({
    path: 'photo_list',
  });

  // Wrapper, zawsze POST
  const getPhotos = useCallback((): Promise<PhotosResponse | undefined> => {
    return getPhotosRaw({ method: 'POST' })
      .then(res => {
        if (res?.zdjecia) {
          setPhotos(res.zdjecia);
        }
        return res;
      })
      .catch(error => {
        setError(error?.toString() || 'Unknown error');
        throw error;
      });
  }, [getPhotosRaw]);

  // Reaguj na zmiany w photosResponse
  useEffect(() => {
    if (photosResponse?.zdjecia) {
      setPhotos(photosResponse.zdjecia);
    }
  }, [photosResponse]);

  // NIE wywołuj getPhotos automatycznie nigdzie w tym pliku!
  // Wywołuj getPhotos tylko ręcznie w ekranie galerii głównej lub po dodaniu zdjęcia.

  // Obsługa tagów (bez zmian)
  const {
    execute: getTagsRaw,
    loading: tagsLoading,
    result: tagsResponse,
  } = useApi<TagsResponse, object>({
    path: 'tag_list',
  });

  const getTags = useCallback((): Promise<TagsResponse | undefined> => {
    return getTagsRaw({ method: 'POST' });
  }, [getTagsRaw]);

  useEffect(() => {
    if (tagsResponse?.tag_list) {
      setTags(tagsResponse.tag_list);
    }
  }, [tagsResponse]);

  // Funkcja do usuwania zdjęć
  const { execute: deletePhotoRaw } = useApi<object, { photo_id: number }>({
    path: 'photo_delete',
  });

  const deletePhoto = useCallback(
    async (photoId: number) => {
      try {
        const response = await deletePhotoRaw({
          method: 'POST',
          data: { photo_id: photoId },
        });

        if (!response) {
          throw new Error('Brak odpowiedzi z serwera');
        }

        setPhotos(prev =>
          prev ? prev.filter(photo => photo.id !== photoId) : prev,
        );
      } catch (error: any) {
        setError(error?.toString() || 'Unknown error');
        throw error;
      }
    },
    [deletePhotoRaw],
  );

  const contextValue = useMemo(
    () => ({
      photos,
      tags,
      getPhotos,
      getTags,
      deletePhoto,
      photosLoading,
      tagsLoading,
    }),
    [photos, tags, getPhotos, getTags, deletePhoto, photosLoading, tagsLoading],
  );

  return (
    <GalleryContext.Provider value={contextValue}>
      {children}
    </GalleryContext.Provider>
  );
}

export default function useGallery() {
  return useContext(GalleryContext);
}
