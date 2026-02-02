import { useNavigation } from '@react-navigation/native';
import { Button } from '@rneui/themed';
import { format, parseISO } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../consts/Colors';
import { TasksMenuScreenProps } from '../../navigation/types';
import useStaff from '../../providers/StaffProvider';
import { Task } from '../../providers/TasksProvider';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const { id, nazwa, typ, grupa, status, start_date, end_date, instalacja_info } = task;
  const navigation = useNavigation<TasksMenuScreenProps['navigation']>();
  const { teams, employees } = useStaff();

  // Get type color
  const typeColor = useMemo(() => {
    switch (typ.toLowerCase()) {
      case 'oględziny':
        return '#FF7E01'; // Orange
      case 'montaż':
        return '#4CBF24'; // Green
      case 'szkolenie':
        return '#CE177D'; // Pink
      default:
        return Colors.calendarPrimary;
    }
  }, [typ]);

  // Status button is always blue
  const statusColor = '#3B82F6';

  // Format times
  const formattedStartTime = useMemo(() => {
    try {
      return format(parseISO(start_date), 'HH:mm');
    } catch {
      return '';
    }
  }, [start_date]);

  const formattedEndTime = useMemo(() => {
    try {
      return end_date ? format(parseISO(end_date), 'HH:mm') : '';
    } catch {
      return '';
    }
  }, [end_date]);

  // Get team/employee info
  const teamInfo = useMemo(() => {
    if (!grupa) return null;
    if (grupa > 1) {
      const team = teams?.find(t => t.id === grupa);
      return {
        number: grupa,
        name: team ? team.nazwa : `Ekipa ${grupa}`,
      };
    }
    const employee = employees?.employees?.find(e => e.id === grupa);
    return {
      number: grupa,
      name: employee
        ? `${employee.first_name} ${employee.last_name}`
        : `Pracownik ${grupa}`,
    };
  }, [grupa, teams, employees]);

  // Get address parts
  const addressParts = useMemo(() => {
    if (!instalacja_info) return null;

    const street = [
      instalacja_info.ulica,
      instalacja_info.numer_domu,
      instalacja_info.mieszkanie && `/${instalacja_info.mieszkanie}`,
    ].filter(Boolean).join(' ');

    const cityLine = [
      instalacja_info.kod_pocztowy,
      instalacja_info.miasto,
    ].filter(Boolean).join(' ');

    return {
      street: street || null,
      city: cityLine || null,
    };
  }, [instalacja_info]);

  const handlePress = () => {
    (navigation as any).navigate('TaskDetails', { task });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <Text style={styles.typeBadgeText}>
          {typ.charAt(0).toUpperCase() + typ.slice(1).toLowerCase()}
        </Text>
      </View>

      {/* Address and time row */}
      <View style={styles.addressTimeRow}>
        <View style={styles.addressColumn}>
          {addressParts?.street ? (
            <>
              <Text style={styles.addressText} numberOfLines={1}>
                {addressParts.street}
              </Text>
              {addressParts.city && (
                <Text style={styles.addressText} numberOfLines={1}>
                  {addressParts.city}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.addressText}>
              {nazwa || 'Brak adresu'}
            </Text>
          )}
        </View>
        <Text style={styles.timeText}>
          Dziś: {formattedStartTime}
          {formattedEndTime && ` - ${formattedEndTime}`}
        </Text>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        {teamInfo && (
          <View style={styles.teamContainer}>
            <View style={styles.teamCircle}>
              <Text style={styles.teamCircleText}>{teamInfo.number}</Text>
            </View>
            <Text style={styles.teamText}>{teamInfo.name}</Text>
          </View>
        )}
        <Button
          title={status}
          buttonStyle={[styles.statusButton, { backgroundColor: statusColor }]}
          titleStyle={styles.statusButtonText}
          onPress={handlePress}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  addressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressColumn: {
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFC0CB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCircleText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  teamText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusButtonText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.white,
  },
});

export default TaskCard;
