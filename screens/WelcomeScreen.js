import React, { Component } from 'react'
import { StyleSheet, View, Text, Button } from 'react-native'
import { AppLoading } from 'expo'
import firebase from 'firebase'

// Switch navigator for login screen, have to restructure App component first
class WelcomeScreen extends Component {
  state = {
    appIsReady: false,
  }
  _isMounted = false

  componentDidMount() {
    this._isMounted = true
    this.setState({
      appIsReady: true,
    })
    this.checkIfLoggedIn()
  }

  checkIfLoggedIn = () => {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.props.navigation.navigate('App');
      }
      else {
        this.props.navigation.navigate('LoginScreen');
      }
    }.bind(this))
  }

  render() {
    if (!this.state.appIsReady) {
      return <AppLoading />
    }
    return ( // FIXME: shouldnt be rendering, should redirect to DashboardScreen or LoginScreen
      <View style={styles.container}>
        <Button title="Login" onPress={() => this.props.navigation.navigate('DashboardScreen')}/>
        <Button title="Signup" onPress={() => this.props.navigation.navigate('DashboardScreen')}/>
        <Text>Welcome Screen</Text>
      </View>
    );
  }
}

export default WelcomeScreen

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
