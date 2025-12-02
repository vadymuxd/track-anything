import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface BurgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (screenName: string) => {
    onClose();
    setTimeout(() => {
      (navigation as any).navigate(screenName);
    }, 300);
  };

  const menuItems = [
    { name: 'History', icon: 'insert-chart', screen: 'History' },
    { name: 'Events', icon: 'event', screen: 'Events' },
    { name: 'Logs', icon: 'list', screen: 'Logs' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.menuHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.menuItems}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.screen)}
            >
              <MaterialIcons name={item.icon as any} size={24} color="#333" />
              <Text style={styles.menuItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
  },
});
