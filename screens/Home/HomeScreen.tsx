import { Divider, Text } from '@rneui/themed';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { MainParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients from '../../providers/ClientsProvider';
import useTasks, { Task } from '../../providers/TasksProvider';
import Categories from './Categories';

function HomeScreen() {
  const { isUserClient, user } = useAuth();
  const { clients, getClients } = useClients();
  const { result: tasks, execute: getTasks } = useTasks();
  const [newestTask, setNewestTask] = useState<Task | null>(null);
  const { execute: updateTaskStatus } = useApi({
    path: 'zadanie_edit',
  });

  // Pobierz zadania tylko raz przy mount - nie przy każdej zmianie getTasks
  useEffect(() => {
    getTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const sortedTasks = [...tasks]
        .filter(x => x.status === 'niewykonane')
        .sort((a, b) => {
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          );
        });
      setNewestTask(sortedTasks[0]);
    }
  }, [tasks]);

  useEffect(() => {
    // Pobierz tylko pierwszą stronę klientów (20 klientów) - wystarczy do wyświetlenia nazwy w zadaniu
    // TYLKO dla adminów i monterów - klienci nie potrzebują listy klientów
    if (getClients && !isUserClient()) {
      getClients(1, false);
    }
  }, [getClients, isUserClient]);

  // Instalacje są pobierane tylko gdy są potrzebne (w getTaskName) - lazy loading
  // Nie pobieramy wszystkich instalacji na start - to byłoby zbyt wolne

  const getTaskName = () => {
    if (newestTask) {
      if (newestTask.nazwa && newestTask.nazwa.length > 0) {
        return newestTask.nazwa;
      }
      if (newestTask.typ && newestTask.typ.length > 0) {
        return (
          newestTask.typ.charAt(0).toUpperCase() +
          newestTask.typ.slice(1).toLowerCase()
        );
      }
    }
    return '';
  };

  const getClientName = () => {
    if (newestTask?.instalacja_info) {
      const info = newestTask.instalacja_info;
      if (info.name) {
        return info.name;
      }
      if (info.first_name || info.last_name) {
        return `${info.first_name || ''} ${info.last_name || ''}`.trim();
      }
      if (info.nazwa_firmy) {
        return info.nazwa_firmy;
      }
    }
    return null;
  };

  const handleMarkAsDone = async (e: any) => {
    e.stopPropagation();
    if (!newestTask) return;

    try {
      const backendData = {
        zadanie_id: newestTask.id,
        nazwa: newestTask.nazwa,
        status: 'wykonane',
        typ: newestTask.typ,
        grupa: newestTask.grupa,
        notatki: newestTask.notatki || null,
        start_date: newestTask.start_date,
        end_date: newestTask.end_date,
        ...(newestTask.instalacja_id && {
          instalacja: newestTask.instalacja_id,
        }),
      };

      await updateTaskStatus({
        method: 'POST',
        data: backendData,
      });

      if (getTasks) {
        await getTasks();
      }
    } catch (error) {
      console.error('Error marking task as done:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'wykonane':
        return Colors.statusDone;
      case 'niewykonane':
        return Colors.statusNotDone;
      case 'zaplanowane':
        return Colors.statusPlanned;
      default:
        return Colors.statusOther;
    }
  };

  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();

  const handleNavigateToTask = () => {
    if (newestTask) {
      navigation.navigate(
        'Tasks' as any,
        {
          screen: 'AddForm',
          params: { task: newestTask },
        } as any,
      );
    }
  };

  return (
    <View
      // colors={['#36B130', '#6EDE2F']}
      // start={{ x: 0, y: 0 }}
      // end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      {/* Header z ikoną hamburgera */}
      {/* <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={handleOpenDrawer}
          style={styles.hamburgerButton}
        >
          <HamburgerIcon color={Colors.black} size={24} />
        </TouchableOpacity>
      </View> */}

      {/* Welcome badge */}
      <View style={styles.welcomeBadge}>
        <Text style={styles.welcomeBadgeText}>Witaj, {user?.name}!</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Najnowsze zadanie nad menu głównym */}
        {newestTask && (
          <View style={styles.cardContainer}>
            <View style={styles.taskHeader}>
              <Text style={styles.header}>Zadania na dziś</Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate(
                    'Tasks' as any,
                    {
                      screen: 'List',
                    } as any,
                  );
                }}
                style={styles.taskHeaderLink}
              >
                <Text style={styles.taskHeaderLinkText}>Zobacz wszystkie</Text>
                <ArrowRightIcon color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>
            <Shadow
              style={styles.card}
              startColor={Colors.cardShadow}
              endColor="#FFFFFF00"
              distance={20}
            >
              <Pressable
                style={pressed => [
                  styles.cardView,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleNavigateToTask}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>{getTaskName()}</Text>
                    {getClientName() && (
                      <Text style={styles.clientName}>{getClientName()}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={handleMarkAsDone}
                  >
                    <View style={styles.checkboxInner} />
                  </TouchableOpacity>
                </View>
                <Divider
                  color={Colors.buttons.cancelBg}
                  orientation="horizontal"
                  width={2}
                  style={styles.horizontalDivider}
                />
                <Pressable
                  style={styles.dateTimeContainer}
                  onPress={handleNavigateToTask}
                >
                  <Text style={styles.dateTimeText}>
                    {
                      new Date(newestTask.start_date)
                        .toISOString()
                        .split('T')[0]
                    }{' '}
                    {new Date(newestTask.start_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </Text>
                </Pressable>
              </Pressable>
            </Shadow>
          </View>
        )}
        {/* Menu główne */}
        <Categories />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  welcomeBadge: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.lightGray,
    paddingBottom: 15,
  },
  welcomeBadgeText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'Archivo_600SemiBold',
  },
  scrollView: {
    // paddingTop: 30,
    backgroundColor: Colors.homeScreenBackground,
    flex: 1,
  },
  header: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'Archivo_600SemiBold',
    lineHeight: 24,
  },
  cardContainer: {
    marginTop: 30,
    marginBottom: 30,
    marginHorizontal: 18,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    width: '100%',
    backgroundColor: Colors.white,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskHeaderLinkText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Archivo_400Regular',
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 70,
  },
  horizontalDivider: {
    marginVertical: 12,
    width: '100%',
    height: 2,
  },
  dateTimeContainer: {
    backgroundColor: Colors.statusDone,
    height: 34,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    borderRadius: 38,
    paddingHorizontal: 12,
  },
  dateTimeText: {
    color: Colors.statusDoneText,
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
  },
  cardView: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
});

export default HomeScreen;
