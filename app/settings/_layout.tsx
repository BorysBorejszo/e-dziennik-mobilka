import { Stack } from "expo-router";

export default function SettingsLayout() {
  // Nest settings screens in a Stack so only the parent 'settings' tab appears
  // in the root Tabs navigator. Child screens (e.g. ustawienia_*) will be
  // pushed onto this stack instead of creating separate tab items.
  return <Stack screenOptions={{ headerShown: false }} />;
}
