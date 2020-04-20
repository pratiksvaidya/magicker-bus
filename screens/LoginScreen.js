import React, { Component } from 'react'
import { StyleSheet, View, Text, Image, Button } from 'react-native'
import * as Expo from 'expo'
import BootstrapStyleSheet from 'react-native-bootstrap-styles';
import * as Google from 'expo-google-app-auth'
import firebase from 'firebase'

class LoginScreen extends Component {

  isUserEqual = (googleUser, firebaseUser) => {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
            providerData[i].uid === googleUser.getBasicProfile().getId()) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  }

  onSignIn = (googleUser) => {
    console.log('Google Auth Response', googleUser);
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
      unsubscribe();
      // Check if we are already signed-in Firebase with the correct user.
      if (!this.isUserEqual(googleUser, firebaseUser)) {
        // Build Firebase credential with the Google ID token.
        var credential = firebase.auth.GoogleAuthProvider.credential(
          googleUser.idToken,
          googleUser.accessToken
        );
        // Sign in with credential from the Google user.
        firebase.auth().signInWithCredential(credential)
          .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        })
        .then(function(){console.log('user signed in')});
      } else {
        console.log('User already signed-in Firebase.');
      }
    }.bind(this));
  }

  signInWithGoogleAsync = async() => {
  try {
    const result = await Google.logInAsync({
      androidClientId: '484198071246-nd14urt85tgpnoln68900seum4jktvku.apps.googleusercontent.com',
      iosClientId: '484198071246-ss0f8u09json7sb5leta6daj18c2m562.apps.googleusercontent.com',
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    });

    if (result.type === 'success') {
      this.onSignIn(result);
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
          <Text style={style={color:'white', fontSize: 30, textAlign: 'center', marginBottom: 40}}> Welcome to Magicker Bus! </Text>
          <Image source={require('../assets/logo_clear_notext.png')} style={{width: 200, height: 50}}  />
          <Text style={style={color:'white', marginTop: 40, marginBottom: 20}}> Sign in to start riding blue buses smarter and faster. </Text>
          <Button style={{backgroundColor: 'white'}} title={"Sign in with Google"}
              onPress={() =>this.signInWithGoogleAsync()}/>
        </View>
    );
  }
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:'#75a7fa'
  },

  Image: {
    flex:1,
    justifyContent: 'center'
  }
})
