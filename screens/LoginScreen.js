import React, { Component } from 'react'
import { StyleSheet, View, Text, Button } from 'react-native'
import Expo from 'expo'

class LoginScreen extends Component {

  signInWithGoogleAsync = async() => {
  try {
    const result = await Google.logInAsync({
      androidClientId: '484198071246-nd14urt85tgpnoln68900seum4jktvku.apps.googleusercontent.com',
      behavior: 'web', // FIXME: may need to delete (deprecated)
      iosClientId: '484198071246-ss0f8u09json7sb5leta6daj18c2m562.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    if (result.type === 'success') {
      return result.accessToken;
    } else {
      return { cancelled: true };
    }
  } catch (e) {
    return { error: true };
  }
}

  render() {
    return (
        <View style={styles.container}>
            <Button title={"Sign In With Google"}
             onPress={() =>this.signInWithGoogleAsync()}
            />
        </View>
    );
  }
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
