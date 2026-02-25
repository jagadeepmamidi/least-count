import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.background,
    border: COLORS.border,
    text: COLORS.text,
    primary: COLORS.accent,
  },
};

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <ThemeProvider value={AppTheme}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
            animationDuration: 200,
          }}
        />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
