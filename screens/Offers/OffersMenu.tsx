import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import { OffersParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import MontazProposals from './MontazProposals';
import OffersList from './OffersList';

type OffersMenuProps = StackScreenProps<OffersParamList, 'Menu'>;

// Create wrapper components that receive the route params
function OffersListTab({
  routeParams,
  shouldShowAddOverlay,
  isTemplate = false,
}: {
  routeParams?: OffersParamList['Menu'];
  shouldShowAddOverlay?: boolean;
  isTemplate?: boolean;
}) {
  // Create a proper route object for OffersList
  const listRoute = {
    params: {
      from: routeParams?.from,
      installationId: routeParams?.installationId,
      clientId: routeParams?.clientId,
      isTemplate,
    },
  };

  return (
    <OffersList route={listRoute} shouldShowAddOverlay={shouldShowAddOverlay} />
  );
}

function OffersMenu({ route }: OffersMenuProps) {
  const { isUserClient } = useAuth();
  const navigation = useNavigation();
  const [shouldShowAddOffer, setShouldShowAddOffer] = useState(
    route.params?.autoShowAddOverlay || false,
  );
  const [shouldShowAddTemplate, setShouldShowAddTemplate] = useState(false);

  // Custom back handler for when coming from installation
  const handleBackPress = () => {
    if (
      route.params?.from === 'installation' &&
      route.params?.clientId &&
      route.params?.installationId
    ) {
      // Navigate back to the specific installation
      (navigation as any).navigate('Clients', {
        screen: 'Settings',
        params: {
          clientId: route.params.clientId.toString(),
          installationId: route.params.installationId.toString(),
        },
      });
    } else {
      // Default back behavior
      navigation.goBack();
    }
  };

  const handleAddOffer = () => {
    setShouldShowAddOffer(true);
    // Reset after a short delay to allow re-triggering
    setTimeout(() => setShouldShowAddOffer(false), 100);
  };

  const handleAddTemplate = () => {
    setShouldShowAddTemplate(true);
    // Reset after a short delay to allow re-triggering
    setTimeout(() => setShouldShowAddTemplate(false), 100);
  };

  // Automatyczne wyświetlenie overlay oferty
  useEffect(() => {
    if (route.params?.autoShowAddOverlay) {
      setShouldShowAddOffer(true);
      // Reset after a short delay to allow re-triggering
      setTimeout(() => setShouldShowAddOffer(false), 100);
    }
  }, [route.params?.autoShowAddOverlay]);

  // Create memoized components to avoid re-creating them on each render
  const OffersComponent = useCallback(
    () => (
      <OffersListTab
        routeParams={route.params}
        shouldShowAddOverlay={shouldShowAddOffer}
        isTemplate={false}
      />
    ),
    [route.params, shouldShowAddOffer],
  );

  const TemplatesComponent = useCallback(
    () => (
      <OffersListTab
        routeParams={route.params}
        shouldShowAddOverlay={shouldShowAddTemplate}
        isTemplate
      />
    ),
    [route.params, shouldShowAddTemplate],
  );

  const ProposalsComponent = useCallback(() => <MontazProposals />, []);

  const tabs = [
    {
      title: 'Oferty',
      component: OffersComponent,
      id: 'offers',
      onAddPress: !isUserClient() ? handleAddOffer : undefined,
    },
    // Szablony tylko dla admin/monter
    ...(!isUserClient()
      ? [
        {
          title: 'Szablony',
          component: TemplatesComponent,
          id: 'templates',
          onAddPress: handleAddTemplate,
        },
        {
          title: 'Terminy',
          component: ProposalsComponent,
          id: 'proposals',
        },
      ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <Tabs
        items={tabs}
        defaultTab={route.params?.tab}
        // linearGradient={['#0A8686', '#36b4b4ff']}
        isWithLinearGradient={false}
        onBackPress={handleBackPress}
        title="Oferty"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});
export default OffersMenu;
