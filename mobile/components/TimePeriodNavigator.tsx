import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Timeframe = 'week' | 'month' | 'year';

interface TimePeriodNavigatorProps {
  timeframe: Timeframe;
  offset: number;
  onOffsetChange: (newOffset: number) => void;
}

export const TimePeriodNavigator: React.FC<TimePeriodNavigatorProps> = ({
  timeframe,
  offset,
  onOffsetChange,
}) => {
  const getPeriodLabel = () => {
    const now = new Date();
    
    if (timeframe === 'week') {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + offset * 7);
      
      const currentDay = targetDate.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(targetDate);
      monday.setDate(monday.getDate() - daysFromMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (monday.getMonth() === sunday.getMonth()) {
        return `${monthNames[monday.getMonth()]} ${monday.getDate()}-${sunday.getDate()}`;
      } else {
        return `${monthNames[monday.getMonth()]} ${monday.getDate()} - ${monthNames[sunday.getMonth()]} ${sunday.getDate()}`;
      }
    } else if (timeframe === 'month') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + offset - 1, 1);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Show 2 months range
      const endMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 2, 0);
      
      if (targetDate.getFullYear() === endMonth.getFullYear()) {
        return `${monthNames[targetDate.getMonth()]} - ${monthNames[endMonth.getMonth()]} ${targetDate.getFullYear()}`;
      } else {
        return `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()} - ${monthNames[endMonth.getMonth()]} ${endMonth.getFullYear()}`;
      }
    } else {
      // year
      const targetYear = now.getFullYear() + offset;
      return `${targetYear}`;
    }
  };

  const isCurrentPeriod = offset === 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => onOffsetChange(offset - 1)}
      >
        <MaterialIcons name="chevron-left" size={20} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>
      
      <TouchableOpacity
        style={[styles.navButton, isCurrentPeriod && styles.navButtonDisabled]}
        onPress={() => onOffsetChange(offset + 1)}
        disabled={isCurrentPeriod}
      >
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={isCurrentPeriod ? '#ccc' : '#333'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
  },
  navButton: {
    padding: 4,
    borderRadius: 4,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
});
