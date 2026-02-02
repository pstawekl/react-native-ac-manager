/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigation } from '@react-navigation/native';
import { Divider, Tab, TabView } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Colors from '../consts/Colors';
import ButtonsHeader from './ButtonsHeader';
import FloatingActionButton from './FloatingActionButton';

type TabItem = {
  id?: string;
  title: string;
  component: JSX.Element | ((props: { isActive: boolean }) => JSX.Element);
  onAddPress?: () => void;
};

type TabsProps = {
  items: TabItem[];
  defaultTab?: string;
  linearGradient?: string[];
  isButtonsHeader?: boolean;
  isWithLinearGradient?: boolean;
  onBackPress?: () => void;
  title?: string;
  onTabChange?: (index: number) => void;
  headerContent?: React.ReactNode;
  headerDividerColor?: string;
  fabBgColor?: string;
  fabIconColor?: string;
  onFilterPress?: () => void;
};

type TabMeasurement = {
  width: number;
  x: number;
};

export default function Tabs({
  items,
  defaultTab,
  linearGradient,
  isButtonsHeader = true,
  isWithLinearGradient = true,
  onBackPress,
  title,
  onTabChange,
  headerContent,
  headerDividerColor,
  fabBgColor,
  fabIconColor,
  onFilterPress,
}: TabsProps): JSX.Element {
  const [index, setIndex] = useState(
    defaultTab ? items.findIndex(item => item.id === defaultTab) : 0,
  );
  const [tabMeasurements, setTabMeasurements] = useState<TabMeasurement[]>([]);
  const navigation = useNavigation();

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    if (onTabChange) {
      onTabChange(newIndex);
    }
  };

  const measureTab = (event: LayoutChangeEvent, tabIndex: number) => {
    const { width, x } = event.nativeEvent.layout;
    setTabMeasurements(prev => {
      const newMeasurements = [...prev];
      newMeasurements[tabIndex] = { width, x };
      return newMeasurements;
    });
  };

  const content = (
    <View
      style={[
        styles.container,
        isWithLinearGradient && styles.containerWithLinearGradient,
        !isWithLinearGradient && styles.containerWithoutLinearGradient,
      ]}
    >
      {isButtonsHeader && (
        <ButtonsHeader
          onBackPress={onBackPress || navigation.goBack}
          title={title}
          onFilterPress={onFilterPress}
        />
      )}
      {headerContent && (
        <View style={styles.headerContent}>{headerContent}</View>
      )}
      {headerContent && (
        <View style={styles.headerContent}>{headerContent}</View>
      )}
      <Tab
        value={index}
        onChange={handleIndexChange}
        style={styles.tab}
        indicatorStyle={styles.indicator}
      >
        {items.map((item, tabIndex) => (
          <Tab.Item
            key={item.title}
            title={item.title}
            active={index === tabIndex}
            titleStyle={[
              styles.tabTitleItem,
              index === tabIndex && styles.tabTitleItemActive,
            ]}
            buttonStyle={[
              styles.tabItem,
              index === tabIndex && styles.tabItemActive,
            ]}
            onLayout={event => measureTab(event, tabIndex)}
          />
        ))}
      </Tab>

      {headerDividerColor && (
        <Divider
          style={[
            styles.headerDivider,
            {
              borderBottomColor: headerDividerColor || Colors.blue,
            },
          ]}
        />
      )}

      {headerDividerColor && (
        <Divider
          style={[
            styles.headerDivider,
            {
              borderBottomColor: headerDividerColor || Colors.blue,
            },
          ]}
        />
      )}

      <TabView
        value={index}
        onChange={handleIndexChange}
        disableTransition
        disableSwipe
      >
        {items.map((item, tabIndex) => (
          <TabView.Item
            key={`${item.title}-content`}
            style={styles.tabViewItem}
          >
            {typeof item.component === 'function'
              ? item.component({ isActive: index === tabIndex })
              : item.component}
          </TabView.Item>
        ))}
      </TabView>

      {items[index]?.onAddPress && (
        <FloatingActionButton
          onPress={items[index]!.onAddPress!}
          backgroundColor={fabBgColor || Colors.offersTeal}
          iconColor={fabIconColor || Colors.white}
        />
      )}
    </View>
  );

  if (!isWithLinearGradient) {
    return <View style={styles.linearGradient}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={linearGradient || ['#7B17B1', '#a864cc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  headerDivider: {
    borderBottomWidth: 2,
  },
  headerDivider: {
    borderBottomWidth: 2,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerWithLinearGradient: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  containerWithoutLinearGradient: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tab: {
    borderBottomWidth: 0,
    borderBottomColor: Colors.transparent,
    paddingHorizontal: 15,
    marginVertical: 20,
  },
  tabViewItem: {
    flex: 1,
  },
  tabItem: {
    width: 'auto',
    height: 34,
    borderRadius: 39,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: Colors.transparent,
  },
  tabItemActive: {
    backgroundColor: Colors.black,
  },
  tabTitleItem: {
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    paddingHorizontal: 0,
  },
  tabTitleItemActive: {
    color: Colors.white,
  },
  indicator: {
    height: 0,
  },
  headerContent: {
    paddingBottom: 0,
  },
  headerContent: {
    paddingBottom: 0,
  },
});
