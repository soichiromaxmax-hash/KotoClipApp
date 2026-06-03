import { ComponentProps } from 'react';
import { OpaqueColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IconName; color: string | OpaqueColorValue }) {
  return (
    <Ionicons name={name} size={24} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#151A22',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '400', letterSpacing: 0.4 },
        tabBarActiveTintColor: '#2DD4BF',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: '学習',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'school' : 'school-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '手動追加',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: '単語帳',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'library' : 'library-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} />,
        }}
      />
      {/* タブバーには表示しないが、ルートとして保持 */}
      <Tabs.Screen
        name="wild"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
