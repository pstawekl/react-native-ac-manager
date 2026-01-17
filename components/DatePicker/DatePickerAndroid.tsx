import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text } from '@rneui/themed';
import { format } from 'date-fns';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  Path,
} from 'react-hook-form';
import { FieldPathValue } from 'react-hook-form/dist/types';
import { StyleSheet, TouchableOpacity } from 'react-native';

type DatePickerAndroidProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  mode?: 'date' | 'time';
  onChangeDate?: (date: Date) => void;
  disabled?: boolean;
};

export default function DatePickerAndroid<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  name,
  control,
  mode = 'date',
  onChangeDate,
  disabled,
}: DatePickerAndroidProps<T>) {
  const handlePress = (value: Date, onChange: (val: Date) => void) => {
    DateTimePickerAndroid.open({
      value: value || new Date(),
      is24Hour: true,
      mode,
      onChange: (event, selectedDate) => {
        if (selectedDate) {
          onChange(selectedDate as FieldPathValue<T, TName>);
          onChangeDate?.(selectedDate);
        }
      },
    });
  };

  return (
    <Controller
      name={name}
      control={control}
      disabled={disabled}
      render={({ field: { value, onChange } }) => {
        let text = '';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (value instanceof Date) {
          text = format(value, mode === 'date' ? 'yyyy-MM-dd' : 'HH:mm');
        }

        return (
          <TouchableOpacity
            style={styles.container}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onPress={() => handlePress(value, onChange)}
          >
            <Text style={styles.text}>{text}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    marginRight: 0,
    flex: 1,
  },
  text: {
    paddingHorizontal: 0,
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: '#000000',
  },
});
