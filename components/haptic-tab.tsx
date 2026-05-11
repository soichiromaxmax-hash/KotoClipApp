import { GestureResponderEvent, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

type TabButtonProps = {
  onPressIn?: (e: GestureResponderEvent) => void;
  [key: string]: any;
};

export function HapticTab({ onPressIn, ...rest }: TabButtonProps) {
  return (
    <Pressable
      {...rest}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
