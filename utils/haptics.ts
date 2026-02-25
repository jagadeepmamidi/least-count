import { Platform } from 'react-native';

let HapticsModule: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  HapticsModule = require('expo-haptics');
}

export const hapticImpact = (
  style: 'Light' | 'Medium' | 'Heavy' = 'Light'
) => {
  if (!HapticsModule) return;
  const feedbackStyle = {
    Light: HapticsModule.ImpactFeedbackStyle.Light,
    Medium: HapticsModule.ImpactFeedbackStyle.Medium,
    Heavy: HapticsModule.ImpactFeedbackStyle.Heavy,
  };
  HapticsModule.impactAsync(feedbackStyle[style]);
};

export const hapticNotification = (
  type: 'Success' | 'Warning' | 'Error' = 'Success'
) => {
  if (!HapticsModule) return;
  const feedbackType = {
    Success: HapticsModule.NotificationFeedbackType.Success,
    Warning: HapticsModule.NotificationFeedbackType.Warning,
    Error: HapticsModule.NotificationFeedbackType.Error,
  };
  HapticsModule.notificationAsync(feedbackType[type]);
};
