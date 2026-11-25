import { Alert, Platform } from 'react-native';

/**
 * Alert.alert is a no-op in react-native-web, so the browser build falls back to the
 * built-in dialogs. Native builds use the platform alert.
 */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive = false,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Back', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
