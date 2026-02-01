import { Text } from '@rneui/themed';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Modal,
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Clipboard,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';


function TaskDetails({ navigation, route }: any) {
  const MENU_WIDTH = 220;
  const MENU_MARGIN = 8;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const task = route?.params?.task;
  const fromClient = route?.params?.fromClient;
  const fromInstallation = route?.params?.fromInstallation;
  const clientId = route?.params?.clientId;
  const installationId = route?.params?.installationId;

  const [currentStatus, setCurrentStatus] = useState(
    task?.status || 'niewykonane',
  );
  const phoneRef = React.useRef<View>(null);
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const addressRef = React.useRef<View>(null);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { execute: getTasks } = useTasks();
  const { teams, employees } = useStaff();

  const { control, setValue } = useForm({
    defaultValues: {
      status: task?.status || 'niewykonane',
    },
  });

  const { execute: updateTaskStatus } = useApi({ path: 'zadanie_edit' });
  const { execute: deleteTask } = useApi({ path: 'zadanie_delete' });

  const handleGoBack = useCallback(() => {
    if (fromInstallation && installationId && clientId) {
      navigation.navigate('Clients', {
        screen: 'Settings',
        params: {
          installationId: installationId.toString(),
          clientId: clientId.toString(),
          activeTab: 'zadania',
        },
      });
    } else if (fromClient && clientId) {
      navigation.navigate('Clients', {
        screen: 'Menu',
        params: { clientId, activeTab: 'zadania' },
      });
    } else {
      navigation.goBack();
    }
  }, [fromInstallation, fromClient, installationId, clientId, navigation]);

  const assignedInfo = useMemo(() => {
    if (!task || !task.grupa) return null;
    const grupaId = task.grupa;
    if (grupaId > 1) {
      const team = teams?.find(t => t.id === grupaId);
      return {
        number: grupaId,
        name: team ? team.nazwa : `Ekipa ${grupaId}`,
      };
    }
    const employee = employees?.employees?.find(e => e.id === grupaId);
    return {
      number: grupaId,
      name: employee
        ? `${employee.first_name} ${employee.last_name}`
        : `Pracownik ${grupaId}`,
    };
  }, [task, teams, employees]);

  const executorPhone = useMemo(() => {
    if (!task || !task.grupa) return null;
    const grupaId = task.grupa;
    if (grupaId > 1) return '+48 000 000 000';
    const employee = employees?.employees?.find(e => e.id === grupaId);
    return employee?.phone || '+48 000 000 000';
  }, [task, employees]);

  if (!task) {
    return (
      <View style={styles.container}>
        <ButtonsHeader onBackPress={handleGoBack} title="Montaż" />
        <View style={styles.center}>
          <Text style={styles.errorText}>Nie znaleziono zadania</Text>
        </View>
      </View>
    );
  }

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(task.start_date), 'EEEE, dd LLLL yyyy', {
        locale: pl,
      });
    } catch {
      return 'Nieprawidłowa data';
    }
  }, [task.start_date]);

  const formattedTime = useMemo(() => {
    try {
      return format(new Date(task.start_date), 'HH:mm');
    } catch {
      return '';
    }
  }, [task.start_date]);

  const clientName = useMemo(() => {
    if (!task.instalacja_info) return null;
    return (
      task.instalacja_info.nazwa_firmy ||
      `${task.instalacja_info.first_name || ''} ${
        task.instalacja_info.last_name || ''
      }`.trim()
    );
  }, [task.instalacja_info]);

  const clientPhone = useMemo(() => {
    if (!task.instalacja_info) return null;
    return task.instalacja_info.numer_telefonu;
  }, [task.instalacja_info]);

  const clientAddress = useMemo(() => {
    if (!task.instalacja_info) return null;
    const parts = [
      task.instalacja_info.ulica,
      task.instalacja_info.numer_domu,
      task.instalacja_info.mieszkanie &&
      `/${task.instalacja_info.mieszkanie}`,
      task.instalacja_info.kod_pocztowy,
      task.instalacja_info.miasto,
    ].filter(Boolean);
    return parts.join(' ');
  }, [task.instalacja_info]);

  const installationAddress = useMemo(() => {
    if (!task.instalacja_info) return null;
    return task.instalacja_info.name || clientAddress;
  }, [task.instalacja_info, clientAddress]);

  const handleSaveStatus = async () => {
    try {
      const backendData = {
        zadanie_id: task.id,
        nazwa: task.nazwa,
        status: currentStatus,
        typ: task.typ,
        grupa: task.grupa,
        notatki: task.notatki || null,
        start_date: task.start_date,
        end_date: task.end_date,
        ...(task.instalacja && { instalacja: task.instalacja }),
      };

      await updateTaskStatus({ method: 'POST', data: backendData });
      if (getTasks) await getTasks();
      handleGoBack();
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować statusu zadania');
    }
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader onBackPress={handleGoBack} title="Montaż" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title */}
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>
            {task.typ === 'montaż' ? 'Montaż' : task.typ}
          </Text>
        </View>

        <Text style={styles.title}>
          {task.nazwa || 'Montaż instalacji Lorem Ipsum'}
        </Text>

        {/* Data i godzina */}
        <InfoRow
          icon="calendar"
          label="Data i godzina"
          right={
            <>
              <Text style={styles.value}>{capitalize(formattedDate)}</Text>
              <Text style={styles.value}>{formattedTime}</Text>
            </>
          }
        />

        {/* Klient */}
        {clientName && (
          <>
            <Text style={styles.sectionHeader}>Klient</Text>

            <InfoRow
              icon="user"
              label="Klient"
              right={
                <>
                  <Text style={styles.value}>{clientName}</Text>

                  {clientPhone && (
                    <TouchableOpacity
                      ref={phoneRef}
                      onPress={() => {
                        phoneRef.current?.measureInWindow((x, y, width, height) => {
                          const spaceBelow = SCREEN_HEIGHT - (y + height);
                          const spaceAbove = y;

                          // pion: dół jeśli się mieści, inaczej góra
                          const top =
                            spaceBelow > 180
                              ? y + height + MENU_MARGIN
                              : y - 180 - MENU_MARGIN;

                          // poziom: clamp do ekranu
                          const left = Math.min(
                            Math.max(MENU_MARGIN, x),
                            SCREEN_WIDTH - MENU_WIDTH - MENU_MARGIN,
                          );

                          setMenuPosition({ x: left, y: top });
                          setPhoneMenuOpen(true);
                        });
                      }}
                    >
                      <Text style={styles.phoneText}>{clientPhone}</Text>
                    </TouchableOpacity>
                  )}
                </>
              }
            />
          </>
        )}

        {/* Adres */}
        {clientAddress && (
          <InfoRow
            icon="map-pin"
            label="Adres"
            right={
              <TouchableOpacity
                ref={addressRef}
                onPress={() => {
                  addressRef.current?.measureInWindow((x, y, width, height) => {
                    const spaceBelow = SCREEN_HEIGHT - (y + height);

                    const top =
                      spaceBelow > 140
                        ? y + height + MENU_MARGIN
                        : y - 140 - MENU_MARGIN;

                    const left = Math.min(
                      Math.max(MENU_MARGIN, x),
                      SCREEN_WIDTH - MENU_WIDTH - MENU_MARGIN,
                    );

                    setMenuPosition({ x: left, y: top });
                    setAddressMenuOpen(true);
                  });
                }}
              >
                <Text style={styles.phoneText}>
                  {task.instalacja_info.ulica} {task.instalacja_info.numer_domu}
                  {task.instalacja_info.mieszkanie
                    ? `/${task.instalacja_info.mieszkanie}`
                    : ''}
                  {'\n'}
                  {task.instalacja_info.kod_pocztowy}{' '}
                  {task.instalacja_info.miasto}
                </Text>
              </TouchableOpacity>
            }
          />
        )}

        {/* Montaż */}
        {task.typ === 'montaż' && installationAddress && (
          <>
            <Text style={styles.sectionHeader}>Montaż</Text>
            <InfoRow
              icon="home"
              label="Adres montażu"
              right={
                <Text style={styles.value}>
                  {task.instalacja_info.ulica}{' '}
                  {task.instalacja_info.numer_domu}
                  {task.instalacja_info.mieszkanie
                    ? `/${task.instalacja_info.mieszkanie}`
                    : ''}
                  {'\n'}
                  {task.instalacja_info.kod_pocztowy}{' '}
                  {task.instalacja_info.miasto}
                </Text>
              }
            />
          </>
        )}

        {/* Wykonawca */}
        {assignedInfo && (
          <>
            <Text style={styles.sectionHeader}>Wykonawca</Text>
            <InfoRow
              icon="users"
              label="Wykonawca"
              right={
                <View style={styles.executorRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {assignedInfo.number}
                    </Text>
                  </View>
                  <Text style={styles.value}>{assignedInfo.name}</Text>
                </View>
              }
            />
          </>
        )}

        {/* Kontakt */}
        {executorPhone && (
          <InfoRow
            icon="phone"
            label="Kontakt"
            right={
              <View style={styles.contactRow}>
                <Text style={styles.value}>{executorPhone}</Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Feather name="copy" size={16} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Uwagi */}
        {task.notatki && task.notatki.trim() !== '' && (
          <>
            <Text style={styles.sectionHeader}>Uwagi</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notes}>{task.notatki}</Text>
            </View>
          </>
        )}

        {/* Rozliczenie */}
        {(task.typ === 'montaż' || task.typ === 'oględziny') && (
          <View style={styles.dropdownSection}>
            <Text style={styles.dropdownTitle}>Rozliczenie</Text>
            <Dropdown
              name="billing"
              control={control}
              options={[
                { label: 'Ustaw status', value: 'pending' },
                {
                  label:
                    task.typ === 'montaż'
                      ? 'Faktura wystawiona'
                      : 'Oferta dodana',
                  value: 'done',
                },
              ]}
              isBordered
              borderColor="#ECECEC"
              customWidth="100%"
              containerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
            />
          </View>
        )}

        {/* Status zadania */}
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownTitle}>Status zadania</Text>
          <Dropdown
            name="status"
            control={control}
            options={[
              { label: 'Ustaw status', value: 'pending' },
              { label: 'Zaplanowane', value: 'Zaplanowane' },
              { label: 'Wykonane', value: 'wykonane' },
              { label: 'Niewykonane', value: 'niewykonane' },
            ]}
            isBordered
            borderColor="#ECECEC"
            customWidth="100%"
            containerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            onChange={value => {
              setCurrentStatus(value);
              setValue('status', value);
            }}
          />
        </View>

        {addressMenuOpen && (
          <Modal transparent animationType="fade">
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setAddressMenuOpen(false)}
            >
              <View
                style={[
                  styles.phoneMenu,
                  {
                    position: 'absolute',
                    top: menuPosition.y,
                    left: menuPosition.x,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const address = `${task.instalacja_info.ulica} ${task.instalacja_info.numer_domu}, ${task.instalacja_info.kod_pocztowy} ${task.instalacja_info.miasto}`;
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        address,
                      )}`,
                    );
                    setAddressMenuOpen(false);
                  }}
                >
                  <Feather name="map-pin" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Zobacz na mapie</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const address = `${task.instalacja_info.ulica} ${task.instalacja_info.numer_domu}, ${task.instalacja_info.kod_pocztowy} ${task.instalacja_info.miasto}`;
                    Linking.openURL(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        address,
                      )}`,
                    );
                    setAddressMenuOpen(false);
                  }}
                >
                  <Feather name="navigation" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Wyznacz trasę</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {phoneMenuOpen && (
          <Modal transparent animationType="fade">
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setPhoneMenuOpen(false)}
            >
              <View
                style={[
                  styles.phoneMenu,
                  {
                    position: 'absolute',
                    top: menuPosition.y + 8, // mały odstęp
                    left: menuPosition.x,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    Linking.openURL(`tel:${clientPhone}`);
                    setPhoneMenuOpen(false);
                  }}
                >
                  <Feather name="phone" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Zadzwoń</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    Clipboard.setString(clientPhone);
                    setPhoneMenuOpen(false);
                  }}
                >
                  <Feather name="copy" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Kopiuj</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    Linking.openURL(`sms:${clientPhone}`);
                    setPhoneMenuOpen(false);
                  }}
                >
                  <Feather name="mail" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Napisz wiadomość</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleGoBack}>
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStatus}>
          <Text style={styles.saveText}>Zastosuj</Text>
        </TouchableOpacity>
      </View>

      <ConfirmationOverlay
        visible={deleteModalVisible}
        onBackdropPress={() => setDeleteModalVisible(false)}
        onSubmit={async () => {
          try {
            await deleteTask({
              method: 'POST',
              data: { zadanie_id: task.id },
            });
            if (getTasks) await getTasks();
            setDeleteModalVisible(false);
            handleGoBack();
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć zadania');
          }
        }}
        title="Czy na pewno chcesz usunąć zadanie?"
        submitColor={Colors.red}
      />
    </View>
  );
}

export default TaskDetails;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                   */
/* -------------------------------------------------------------------------- */

function InfoRow({
                   icon,
                   label,
                   right,
                 }: {
  icon: any;
  label: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={16} color="#9E9E9E" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
  },

  /* Title */
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111',
    marginBottom: 20,
  },

  /* Section header */
  sectionHeader: {
    fontSize: 12,
    lineHeight: 18,          // 150% z 12px
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '500',       // opcjonalnie, jeśli font wspiera
    letterSpacing: 0,
    marginBottom: 6,
    marginTop: 12,
  },

  /* Rows */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 180,
  },
  rowLabel: {
    color: '#ADADAD',
  },
  rowRight: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  value: {
    textAlign: 'left',
  },

  /* Executor */
  executorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3CC13B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  /* Contact */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    padding: 4,
  },

  /* Notes */
  notesBox: {
    marginTop: 4,
    paddingVertical: 4,
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
    color: '#111',
  },

  /* Dropdowns */
  dropdownSection: {
    marginTop: 16,
  },

  dropdownTitle: {
    fontSize: 12,
    lineHeight: 18,          // 150% z 12px
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '500',       // opcjonalnie, jeśli font wspiera
    letterSpacing: 0,
    marginBottom: 6,
    marginTop: 12,
  },

  dropdownContainer: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },

  dropdownText: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    color: '#111',
  },

  dropdownPlaceholder: {
    color: '#ADADAD',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  topBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE7DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    marginBottom: 20,
  },
  topBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#FF6B35',
  },


  phoneText: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    color: '#111',
    textDecorationLine: 'underline',
  },

  menuOverlay: {
    flex: 1,
    paddingTop: 120, // jeśli menu ma być niżej — zwiększ
  },

  phoneMenu: {
    width: 220,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  menuItemText: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    color: '#111',
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 12,
  },

});
