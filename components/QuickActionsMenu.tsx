import { CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';

import ContextMenu from './ContextMenu';
import ClientSelectorModal from './ClientSelectorModal';
import FolderOpenIcon from './icons/FolderOpenIcon';
import ReceiptIcon from './icons/ReceiptIcon';
import SettingIcon from './icons/SettingIcon';
import TaskListIcon from './icons/TaskListIcon';
import UserIcon from './icons/UserIcon';
import Colors from '../consts/Colors';
import { BottomTabParamList, MainParamList } from '../navigation/types';
import { Client } from '../providers/ClientsProvider';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList>,
  DrawerNavigationProp<MainParamList>
>;

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp;
}

function QuickActionsMenu({
  visible,
  onClose,
  navigation,
}: QuickActionsMenuProps) {
  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);

  const handleAddClient = () => {
    onClose();
    (navigation as any).navigate('HomeTab', {
      screen: 'Clients',
      params: {
        screen: 'Form',
      },
    });
  };

  const handleAddInstallation = () => {
    onClose();
    setClientSelectorVisible(true);
  };

  const handleClientSelectForInstallation = (client: Client) => {
    setClientSelectorVisible(false);
    (navigation as any).navigate('HomeTab', {
      screen: 'Clients',
      params: {
        screen: 'Menu',
        params: {
          clientId: client.id,
          activeTab: 'instalacje',
          autoShowInstallationOverlay: true,
        },
      },
    });
  };

  const handleAddTask = () => {
    onClose();
    (navigation as any).navigate('HomeTab', {
      screen: 'Tasks',
      params: {
        screen: 'AddForm',
      },
    });
  };

  const handleAddOffer = () => {
    onClose();
    (navigation as any).navigate('HomeTab', {
      screen: 'Offers',
      params: {
        screen: 'Menu',
        params: {
          autoShowAddOverlay: true,
        },
      },
    });
  };

  const handleAddInvoice = () => {
    onClose();
    (navigation as any).navigate('HomeTab', {
      screen: 'Invoices',
      params: {
        screen: 'Form',
      },
    });
  };

  const options = [
    {
      title: 'Dodaj klienta',
      icon: <UserIcon color={Colors.black} size={20} />,
      onPress: handleAddClient,
    },
    {
      title: 'Dodaj instalację',
      icon: <SettingIcon color={Colors.black} size={20} />,
      onPress: handleAddInstallation,
    },
    {
      title: 'Dodaj zadanie',
      icon: <TaskListIcon color={Colors.black} size={20} />,
      onPress: handleAddTask,
    },
    {
      title: 'Dodaj ofertę',
      icon: <FolderOpenIcon color={Colors.black} size={20} />,
      onPress: handleAddOffer,
    },
    {
      title: 'Dodaj fakturę',
      icon: <ReceiptIcon color={Colors.black} size={20} />,
      onPress: handleAddInvoice,
    },
  ];

  return (
    <>
      <ContextMenu
        visible={visible}
        onBackdropPress={onClose}
        options={options}
        title="Szybkie akcje"
      />

      <ClientSelectorModal
        visible={clientSelectorVisible}
        onClose={() => setClientSelectorVisible(false)}
        onClientSelect={handleClientSelectForInstallation}
        title="Wybierz klienta"
      />
    </>
  );
}

export default QuickActionsMenu;

