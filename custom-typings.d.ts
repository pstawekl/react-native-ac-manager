import * as RNC from 'react-native-calendars';

declare module 'react-native-calendars' {
  type CustomEventProps = {
    color?: string;
    borderColor?: string;
  };

  export type Event = RNC.Event & CustomEventProps;
  export type PackedEvent = RNC.PackedEvent & CustomEventProps;
}
