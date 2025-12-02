import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MonthNavigatorProps {
  offset: number;
  onOffsetChange: (newOffset: number) => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  offset,
  onOffsetChange,
}) => {
  const getMonthLabel = () => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  };

  const isCurrentMonth = offset === 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => onOffsetChange(offset - 1)}
      >
        <MaterialIcons name="chevron-left" size={24} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.monthLabel}>{getMonthLabel()}</Text>
      
      <TouchableOpacity
        style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
        onPress={() => onOffsetChange(offset + 1)}
        disabled={isCurrentMonth}
      >
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={isCurrentMonth ? '#ccc' : '#333'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
});
