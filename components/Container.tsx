import { KeyboardAvoidingView, Platform, ViewProps } from 'react-native';
import { KeyboardAvoidingViewProps } from 'react-native/Libraries/Components/Keyboard/KeyboardAvoidingView';

type ContainerProps = ViewProps & {
  keyboardVerticalOffset?: KeyboardAvoidingViewProps['keyboardVerticalOffset'];
};

function Container({ keyboardVerticalOffset, ...props }: ContainerProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset ?? 100}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...props}
    />
  );
}

export default Container;
