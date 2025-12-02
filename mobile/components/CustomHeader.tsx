import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BurgerMenu } from './BurgerMenu';

interface CustomHeaderProps {
  title: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          
          <TouchableOpacity
            style={styles.burgerButton}
            onPress={() => setMenuVisible(true)}
          >
            <MaterialIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BurgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  burgerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
