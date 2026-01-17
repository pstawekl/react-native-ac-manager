import { Chip, Overlay, Text } from '@rneui/themed';
import { compact, find } from 'lodash';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { IconButton, SubmitButton } from '../../components/Button';
import { Dropdown, FormInput } from '../../components/Input';
import CloseIcon from '../../components/icons/CloseIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useGallery, { Tag } from '../../providers/GalleryProvider';

type AddTagForm = {
  name: string;
};

type ChooseTagForm = {
  tag: Tag['id'] | null;
};

function AddTagForm() {
  const { getTags } = useGallery();
  const { execute: saveTag, loading: addTagLoading } = useApi<
    object,
    AddTagForm
  >({
    path: 'add_tag',
  });

  const { control, handleSubmit, setValue, watch } = useForm<AddTagForm>({
    defaultValues: {
      name: '',
    },
  });

  // Watch form values
  const watchedValues = watch();

  const onNewTagSubmit = async (data: AddTagForm) => {
    // Sprawdź czy pole name nie jest puste
    if (!data.name || data.name.trim() === '') {
      return;
    }

    const result = await saveTag({ data });

    if (result) {
      setValue('name', '');

      if (getTags) {
        getTags();
      }
    }
  };

  return (
    <View style={styles.newTag}>
      <FormInput
        name="name"
        control={control}
        customPercentWidth={50}
        grayBackground
        noPadding
        label="Dodaj nowy tag do wyboru"
      />
      <SubmitButton
        title="Zapisz"
        loading={addTagLoading}
        style={styles.saveButton}
        titleStyle={styles.saveButtonTitle}
        onPress={() => {
          handleSubmit(data => {
            onNewTagSubmit(data);
          })();
        }}
      />
    </View>
  );
}

function TagOverlay({
  onBackdropPress,
  onSave,
  visible,
  uri,
}: {
  onBackdropPress: () => void;
  onSave: (tags: Tag[]) => void;
  visible: boolean;
  uri: string;
}) {
  const colors = ['primary', 'secondary', 'success', 'error', 'warning'];

  const { photos, tags } = useGallery();
  const currentPhotoTags = find(photos, { image: uri })?.tags || [];

  const [chosenTags, setChosenTags] = useState<Tag['id'][]>(currentPhotoTags);
  const [options, setOptions] = useState<{ label: string; value: number }[]>(
    [],
  );

  const { control, setValue } = useForm<ChooseTagForm>({
    defaultValues: { tag: null },
  });

  const tagToAdd = useWatch({ control, name: 'tag' });

  useEffect(() => {
    if (tagToAdd !== null) {
      setChosenTags([...chosenTags, tagToAdd]);
      setValue('tag', null);
    }
  }, [tagToAdd, chosenTags, setValue]);

  useEffect(() => {
    const filteredOptions =
      tags
        ?.filter(({ id }) => !chosenTags.includes(id))
        .map(({ name, id }) => ({
          label: name,
          value: id,
        })) || [];

    setOptions(filteredOptions);
  }, [tags, chosenTags]);

  const removeTag = (id: number) => {
    setChosenTags(chosenTags.filter(tagId => tagId !== id));
  };

  const handleSave = () => {
    const tagsToApply = chosenTags.map(id => find(tags, { id }));
    onSave(compact(tagsToApply));

    onBackdropPress();
  };

  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <View style={styles.overlayHeader}>
        <View style={styles.overlayHeaderButton}>
          <IconButton
            withoutBackground
            onPress={onBackdropPress}
            icon={<CloseIcon color={Colors.black} size={22} />}
          />
        </View>
      </View>

      <View style={styles.overlayContentContainer}>
        <Text>Wybrane tagi</Text>
        <View style={styles.tagsContainer}>
          {chosenTags.map(id => (
            <Chip
              key={id}
              title={find(tags, { id })?.name}
              color={colors[id]}
              onPress={() => removeTag(id)}
            />
          ))}
        </View>

        <Dropdown
          isThin
          label="Wybierz z istniejących tagów"
          name="tag"
          control={control}
          options={options}
        />
        <AddTagForm />

        <SubmitButton
          title="Dodaj wybrane"
          style={styles.submitButton}
          onPress={handleSave}
        />
      </View>
    </Overlay>
  );
}

export default TagOverlay;

const styles = StyleSheet.create({
  submitButton: {
    height: 34,
    padding: 0,
    backgroundColor: Colors.buttons.blue,
  },
  saveButton: {
    minWidth: '45%',
    height: 34,
    marginBottom: 24,
    marginLeft: 12,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Colors.buttons.blue,
    backgroundColor: Colors.white,
  },
  saveButtonTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.buttons.blue,
  },
  overlay: {
    padding: 0,
    width: '95%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  overlayHeader: {
    paddingHorizontal: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayHeaderButton: {
    width: 44,
  },
  overlayContentContainer: {
    padding: 20,
  },
  tagsContainer: {
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  newTag: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
