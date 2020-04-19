import React, { useState, Component } from 'react'
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native'
import firebase from 'firebase'
import { TextInput } from 'react-native-gesture-handler'

class User_Profile extends Component {
  constructor(props) {
    super(props);
    this.database = firebase.database();
    this.state = {
      homeAddress: '1100 N University Ave, Ann Arbor, MI 48109',
      user: firebase.auth().currentUser
    };
  }

  componentDidMount() {
    const app = this;
    return this.database.ref(`users/${this.state.user.providerData[0].uid}`).once('value').then(function(snapshot) {
      app.setState({
        homeAddress: snapshot.val() ? snapshot.val().homeAddress : '1100 N University Ave, Ann Arbor, MI 48109',
      })
    });
  }

  storeHomeAddress = () => {
    this.database.ref(`users/${this.state.user.providerData[0].uid}`).set({
      displayName: this.state.user.displayName,
      homeAddress: this.state.homeAddress,
    });
  } 

  render() {
    return (
      <View style={styles.container}>
        <Image style={{height:50, width:50}} source={{uri: this.state.user.photoURL}} />
        <Text>
          {this.state.user.displayName}
        </Text>
        <Text>
          {this.state.user.email}
        </Text>
        <Text
          style={{marginTop: 50, fontWeight: 'bold'}}>
            Home Address
        </Text>
        <TextInput value={this.state.homeAddress} onChangeText={(text) => this.setState({ homeAddress: text })}></TextInput>
        <TouchableOpacity
          onPress={this.storeHomeAddress}
          style={{ margin: 10, backgroundColor: 'gray' }}>
          <Text style={{ margin: 5, color: '#fff' }}>Save</Text>
        </TouchableOpacity>
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
