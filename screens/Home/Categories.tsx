/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

import { Text } from '@rneui/themed';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PermissionGate from '../../components/PermissionGate';
import ArchiveTickIcon from '../../components/icons/ArchiveTickIcon';
import AwardIcon from '../../components/icons/AwardIcon';
import Book2Icon from '../../components/icons/Book2Icon';
import Calendar2Icon from '../../components/icons/Calendar2Icon';
import FolderOpenIcon from '../../components/icons/FolderOpenIcon';
import GalleryIcon from '../../components/icons/GalleryIcon';
import MapIcon from '../../components/icons/MapIcon';
import ReceiptIcon from '../../components/icons/ReceiptIcon';
import TaskListIcon from '../../components/icons/TaskListIcon';
import UserIcon from '../../components/icons/UserIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import Category from './Category';

function Categories() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Na skróty</Text>

      <View style={styles.innerContainer}>
        <PermissionGate permission={Scopes.clients}>
          <Category
            screen="Clients"
            title="Klienci"
            icon={UserIcon}
            iconBackgroundColor="#37B23126"
            iconColor="#37B231"
          />
        </PermissionGate>

        <PermissionGate permission={Scopes.map}>
          <Category
            screen="Map"
            title="Mapa"
            icon={MapIcon}
            iconBackgroundColor="#4CBF2426"
            iconColor="#4CBF24"
          />
        </PermissionGate>

        <PermissionGate permission={Scopes.viewTasks}>
          <>
            <Category
              screen="Tasks"
              title="Zadania"
              icon={TaskListIcon}
              iconBackgroundColor="#E4B20026"
              iconColor="#E4B200"
            />
            <Category
              screen="Calendar"
              title="Kalendarz"
              icon={Calendar2Icon}
              iconBackgroundColor="#FF0C0126"
              iconColor="#FF0C01"
            />
          </>
        </PermissionGate>

        <PermissionGate permission={Scopes.viewInvoices}>
          <Category
            screen="Invoices"
            title="Faktury"
            icon={ReceiptIcon}
            iconBackgroundColor="#AB1A2E26"
            iconColor="#AB1A2E"
          />
        </PermissionGate>

        <PermissionGate permission={Scopes.viewOffers}>
          <Category
            screen="Offers"
            title="Oferty"
            icon={FolderOpenIcon}
            iconBackgroundColor="#C70C7526"
            iconColor="#C70C75"
          />
        </PermissionGate>

        <PermissionGate permission={Scopes.viewCatalogs}>
          <>
            <Category
              screen="Catalogs"
              title="Katalogi"
              icon={Book2Icon}
              iconBackgroundColor="#7C18B226"
              iconColor="#7C18B2"
              params={{ defaultTab: 'Katalogi' }}
            />

            <Category
              screen="Prices"
              title="Cenniki"
              icon={ArchiveTickIcon}
              iconBackgroundColor="#1D469D26"
              iconColor="#1D469D"
              params={{ defaultTab: 'Cennik' }}
            />
          </>
        </PermissionGate>

        <PermissionGate permission={Scopes.gallery}>
          <Category
            screen="GalleryStack"
            title="Galeria"
            icon={GalleryIcon}
            iconBackgroundColor="#4F87F426"
            iconColor="#4F87F4"
          />
        </PermissionGate>

        <PermissionGate permission={Scopes.viewTrainings}>
          <Category
            screen="Certs"
            title="Certyfikaty"
            icon={AwardIcon}
            iconBackgroundColor="#CF0C7926"
            iconColor="#CF0C79"
          />
        </PermissionGate>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingTop: 0,
  },
  header: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
    color: Colors.text,
    marginBottom: 16,
  },
  innerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default Categories;
