import { useNavigation } from '@react-navigation/native';
import { Avatar, Button, ListItem, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import SimpleLightboxBasic from '../../components/SimpleLightboxBasic';
import Colors from '../../consts/Colors';
import getFileName from '../../helpers/files';
import { downloadImageToLocal, getImageUrl } from '../../helpers/image';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CertificatesScreenProps } from '../../navigation/types';
import useCerts, { Certificate } from '../../providers/CertsProvider';

// Helper functions
const getFileExtension = (filePath: string): string => {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const isImageFile = (filePath: string): boolean => {
  const extension = getFileExtension(filePath);
  return ['png', 'jpg', 'jpeg'].includes(extension);
};

function RowRightContent({ onDelete }: { onDelete: () => void }) {
  return (
    <View>
      <Button
        iconPosition="top"
        title="Usuń"
        icon={{
          name: 'trash',
          type: 'font-awesome-5',
          color: Colors.white,
        }}
        containerStyle={styles.buttonContainer}
        buttonStyle={[styles.buttonStyle, styles.buttonDeleteStyle]}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDelete}
      />
    </View>
  );
}

function CertificateRow({
  certificate,
  onDelete,
  onOpenImage,
  onLoadingStart,
  onLoadingEnd,
}: {
  certificate: Certificate;
  onDelete: (id: number) => void;
  onOpenImage: (certificate: Certificate) => void;
  onLoadingStart: () => void;
  onLoadingEnd: () => void;
}) {
  const openCertificateLink = async () => {
    if (!certificate.file) {
      Alert.alert('Błąd', 'Brak ścieżki do pliku certyfikatu.');
      return;
    }

    // Check if it's an image file
    if (isImageFile(certificate.file)) {
      onOpenImage(certificate);
    } else {
      // It's a PDF, open with external app
      try {
        await openPdfFile(certificate.file, {
          onLoadingStart,
          onLoadingEnd,
        });
      } catch (error) {
        onLoadingEnd();
        // eslint-disable-next-line no-console
        console.error('Błąd w openCertificateLink:', error);
      }
    }
  };

  const isImage = isImageFile(certificate.file);

  return (
    <ListItem.Swipeable
      key={certificate.id}
      containerStyle={styles.itemContainer}
      rightContent={
        <RowRightContent onDelete={() => onDelete(certificate.id)} />
      }
      leftWidth={80}
      rightWidth={80}
      onPress={openCertificateLink}
    >
      <Avatar
        rounded
        size={41}
        icon={{
          name: isImage ? 'file-image' : 'file-pdf',
          type: 'font-awesome-5',
        }}
        containerStyle={styles.avatarContainer}
      />
      <ListItem.Content>
        <ListItem.Title>
          {certificate.name ?? getFileName(certificate.file)}
        </ListItem.Title>
        <ListItem.Subtitle>
          Data wydania:{' '}
          {format(new Date(certificate.created_date), 'dd/MM/yyyy')}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem.Swipeable>
  );
}

export default function Certificates() {
  const { navigate, goBack } =
    useNavigation<CertificatesScreenProps['navigation']>();
  const { certificates, getCertificates, certificatesLoading } = useCerts();
  const { execute: deleteCertificate, loading: isDeleteLoading } = useApi({
    path: 'certyfikat_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const onDeleteConfirmed = () => {
    if (idToDelete && getCertificates) {
      deleteCertificate({ data: { certyfikat_id: idToDelete } });
      toggleOverlay();
      getCertificates();
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const handleOpenImage = async (certificate: Certificate) => {
    const imageUrl = getImageUrl(certificate.file);
    if (!imageUrl) {
      Alert.alert(
        'Błąd',
        'Nie można otworzyć zdjęcia: brak poprawnego adresu do pliku.',
      );
      return;
    }
    setLoadingImage(true);
    try {
      const localUri = await downloadImageToLocal(imageUrl);
      setSelectedImageUri(localUri);
      setSelectedCertificate(certificate);
      setLightboxVisible(true);
    } catch {
      Alert.alert(
        'Błąd',
        'Nie udało się pobrać zdjęcia. Sprawdź połączenie i spróbuj ponownie.',
      );
    } finally {
      setLoadingImage(false);
    }
  };

  const handleDeleteCertificateFromLightbox = async (certificateId: number) => {
    if (getCertificates) {
      await deleteCertificate({ data: { certyfikat_id: certificateId } });
      setLightboxVisible(false);
      getCertificates();
    }
  };

  useEffect(() => {
    if (getCertificates) {
      getCertificates();
    }
  }, [getCertificates]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {certificates ? (
          certificates.map(item => (
            <CertificateRow
              key={item.id}
              certificate={item}
              onDelete={onDelete}
              onOpenImage={handleOpenImage}
              onLoadingStart={() => setLoadingPdf(true)}
              onLoadingEnd={() => setLoadingPdf(false)}
            />
          ))
        ) : (
          <Text style={styles.noData}>Brak certyfikatów.</Text>
        )}
      </ScrollView>

      <Spinner
        visible={certificatesLoading || loadingPdf || loadingImage}
        textContent={
          loadingImage
            ? 'Pobieranie zdjęcia...'
            : loadingPdf
              ? 'Pobieranie pliku PDF...'
              : 'Trwa pobieranie danych...'
        }
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć certyfikat ?"
      />
      <SimpleLightboxBasic
        key={selectedImageUri || 'closed'}
        visible={lightboxVisible}
        imageUri={selectedImageUri}
        onClose={() => {
          setLightboxVisible(false);
          setSelectedCertificate(null);
        }}
        photo={
          selectedCertificate
            ? {
              id: selectedCertificate.id,
              image: selectedCertificate.file,
              tags: [],
            }
            : undefined
        }
        onDeletePhoto={handleDeleteCertificateFromLightbox}
        hideTagsSection
        hideEditButton
      />

      <FloatingActionButton
        onPress={() => navigate('AddCertificate')}
        backgroundColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    paddingVertical: 8,
  },
  avatarContainer: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonContainer: {
    borderRadius: 0,
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
  noData: {
    textAlign: 'center',
  },
});
