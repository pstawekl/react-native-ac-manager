import { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../consts/Colors';

export type TabItem = {
  id: string;
  label: string;
};

type HorizontalTabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function HorizontalTabs({
  tabs,
  activeTab,
  onTabChange,
}: HorizontalTabsProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const tabRefs = useRef<{ [key: string]: TouchableOpacity | null }>({});

  // Scroll do aktywnej zakładki przy zmianie
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex >= 0 && tabRefs.current[activeTab]) {
      setTimeout(() => {
        tabRefs.current[activeTab]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              x: Math.max(0, x - 20),
              animated: true,
            });
          },
          () => {
            // Error callback - ignore
          },
        );
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <View style={styles.menuContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuScrollContent}
        style={styles.menuScroll}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            ref={ref => {
              tabRefs.current[tab.id] = ref;
            }}
            style={[
              styles.menuTab,
              activeTab === tab.id && styles.menuTabActive,
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[
                styles.menuTabText,
                activeTab === tab.id && styles.menuTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    backgroundColor: Colors.white,
  },
  menuScroll: {
    maxHeight: 50,
  },
  menuScrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
  },
  menuTab: {
    width: 'auto',
    height: 34,
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 12,
    borderRadius: 39,
    backgroundColor: Colors.transparent, // Brak tła dla nieaktywnego taba
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTabActive: {
    backgroundColor: Colors.greenWithOpacity, // #4CBF2426 - tylko dla aktywnego
  },
  menuTabText: {
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 12,
    textAlign: 'center',
    color: Colors.black, // Czarny dla nieaktywnego taba
    fontFamily: 'Archivo_400Regular',
  },
  menuTabTextActive: {
    color: Colors.green, // #4CBF24 - tylko dla aktywnego taba
  },
});
