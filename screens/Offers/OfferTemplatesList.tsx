import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ListItem, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import { IconButton } from '../../components/Button';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import NoteTextIcon from '../../components/icons/NoteTextIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { Offer } from '../../providers/OffersProvider';

// Swipe action components similar to ClientsList
function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = useCallback(
    (toValue: number) => {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    },
    [translateX],
  );

  useEffect(() => {
    animate(0);
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.templateDelete,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<TrashIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDeletePress}
        withoutBackground
      />
    </Animated.View>
  );
}

// Single template row component similar to ClientRow
const TemplateRow = memo(
  ({
    template,
    onDeletePress,
    onEditPress,
  }: {
    template: Offer;
    onDeletePress: (id: number) => void;
    onEditPress: (template: Offer) => void;
  }) => {
    const [isDuringSwipe, setIsDuringSwipe] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<
      'left' | 'right' | null
    >(null);

    const templateTitle = template.nazwa_oferty || `Szablon ${template.id}`;
    const templateSubtitle = `${
      template.offer_type === 'split' ? 'Split' : 'Multi-Split'
    }`;
    const swipeableStyle = { borderRadius: 6, height: 60 };

    const renderRightActions = (): React.ReactNode => {
      if (swipeDirection !== 'right') {
        return null;
      }
      return (
        <RowRightContent onDeletePress={() => onDeletePress(template.id)} />
      );
    };

    const viewWidth = Dimensions.get('window').width;
    const halfWidth = viewWidth / 2;

    const getDeviceCount = () => {
      if (template.offer_type === 'split') {
        return template.devices_split?.length || 0;
      }
      return template.devices_multi_split?.length || 0;
    };

    return (
      <ListItem.Swipeable
        key={template.id}
        style={[styles.listItem, isDuringSwipe && swipeableStyle]}
        rightStyle={[styles.templateDelete]}
        rightContent={renderRightActions}
        rightWidth={swipeDirection === 'right' ? halfWidth : 0}
        onPress={() => onEditPress(template)}
        onSwipeBegin={direction => {
          setIsDuringSwipe(true);
          setSwipeDirection(direction);
        }}
        onSwipeEnd={() => {
          setIsDuringSwipe(false);
        }}
        containerStyle={
          isDuringSwipe && [
            swipeableStyle,
            { backgroundColor: Colors.draggableBackground },
          ]
        }
      >
        <View style={styles.noteTextIcon}>
          <NoteTextIcon color="#FFFFFF" size={20} />
        </View>
        <ListItem.Content>
          <ListItem.Title style={styles.templateTitle}>
            {templateTitle}
          </ListItem.Title>
          <ListItem.Subtitle style={styles.templateSubtitle}>
            {templateSubtitle} • {getDeviceCount()} urządzeń
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem.Swipeable>
    );
  },
);

export default function OfferTemplatesList({
  isActive,
}: { isActive?: boolean } = {}) {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState<Offer[]>([]);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const { execute: fetchTemplates, loading } = useApi<Offer[]>({
    path: 'oferta_template_list',
  });

  const { execute: deleteTemplate } = useApi<any>({
    path: 'oferta_delete',
  });

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetchTemplates();
      if (response) {
        setTemplates(response);
      }
    } catch (error) {
      throw Error(`Error loading templates: ${error}`);
    }
  }, [fetchTemplates]);

  const toggleDeleteOverlay = useCallback(() => {
    setDeleteVisible(!deleteVisible);
  }, [deleteVisible]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Refresh templates when screen comes into focus or when tab becomes active
  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

  // Also refresh when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadTemplates();
    }
  }, [isActive, loadTemplates]);

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleDeleteOverlay();
  };

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      try {
        await deleteTemplate({ data: { oferta_id: idToDelete } });
        toggleDeleteOverlay();
        Alert.alert('Sukces', 'Szablon został usunięty');
        loadTemplates();
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się usunąć szablonu');
      }
    }
  };

  const handleEditTemplate = (template: Offer) => {
    // Przejście do formularza szablonu w trybie edycji z przekazaniem danych szablonu
    // @TODO
  };
  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlashList<Offer>
          data={templates}
          renderItem={({ item }) => (
            <TemplateRow
              template={item}
              onDeletePress={onDelete}
              onEditPress={handleEditTemplate}
            />
          )}
          estimatedItemSize={80}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak szablonów ofert</Text>
              <Text style={styles.emptySubtext}>
                Utwórz pierwszy szablon klikając przycisk + powyżej
              </Text>
            </View>
          }
        />
      </View>

      <Spinner
        visible={loading}
        textContent="Ładowanie szablonów..."
        textStyle={{ color: Colors.gray }}
      />

      <ConfirmationOverlay
        visible={deleteVisible}
        onBackdropPress={toggleDeleteOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć szablon oferty?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  listItem: {
    width: '100%',
    height: 65,
    paddingVertical: 0,
  },
  buttonStyle: {
    flex: 1,
    overflow: 'hidden',
    height: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 0,
    margin: 0,
    padding: 0,
    backgroundColor: Colors.transparent,
  },
  buttonTitleStyle: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    backgroundColor: Colors.transparent,
  },
  noteTextIcon: {
    width: 40,
    height: '100%',
    borderRadius: 20,
    backgroundColor: Colors.offersTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: 16,
  },
  templateSubtitle: {
    fontSize: 14,
    color: Colors.grayerText,
  },
  templateDelete: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    color: Colors.white,
    backgroundColor: Colors.logout,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
});
