import React from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, Text, Platform, SafeAreaView, TouchableOpacity } from 'react-native'
import NavBar, { NavTitle, NavButton } from 'react-native-nav'
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants'

export default function NavBarCustom(props) {
  const defaultProps = {
    onMute: null,
    mute: false,
  }

  const propTypes = {
    onMute: PropTypes.func,
    mute: PropTypes.bool,
  }

  if (Platform.OS === 'web') {
    return null
  }

  return (
    <SafeAreaView style={{ backgroundColor: '#f5f5f5' }}>
      <NavBar>
        <NavButton/>
        <NavTitle>
          Magicker Bus{'\n'}
        </NavTitle>
        <TouchableOpacity onPress={props.onMute}>
          <FontAwesome 
            name={props.mute ? 'volume-off' : 'volume-up'}
            style={[styles.volume]}
          />
        </TouchableOpacity>
      </NavBar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  volume: {
    fontSize: 20,
    position: "absolute",
    right: 10,
    bottom: 0,
    color: 'gray'
  },
})