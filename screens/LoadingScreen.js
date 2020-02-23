import React, { Component } from 'react'
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native'


// Switch navigator for login screen, have to restructure App component first
class LoadingScreen extends Component {
  render() {
    return (
      <View style={{
        position: "relative",
        alignSelf: "center",
        marginTop: 64
      }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

export default LoadingScreen
