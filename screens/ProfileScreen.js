import React, { Component } from 'react'
import { StyleSheet, View, Text, Button, Image } from 'react-native'
import firebase from 'firebase'

class User_Profile extends Component {
  render() {
    var user = firebase.auth().currentUser

    return (
      <View style={styles.container}>
        <Image style={{height:50, width:50}} source={{uri: user.photoURL}} />
        <Text>
          {user.displayName}
        </Text>
        <Text>
          {user.email}
        </Text>
      </View>
    );
  }
}

export default User_Profile

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
