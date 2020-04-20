import 'react-native-gesture-handler'
import { Asset, Linking } from 'expo'
import React, { Component } from 'react'
import { StyleSheet, View, Text, Platform, Button, AppRegistry, Picker, TextInput } from 'react-native'
import { Bubble, GiftedChat, SystemMessage, IMessage } from './src'

import AccessoryBar from './example-expo/AccessoryBar'
import CustomActions from './example-expo/CustomActions'
import NavBar from './example-expo/NavBar'
import CustomView from './example-expo/CustomView'
import messagesData from './example-expo/data/messages'
import KeyboardSpacer from 'react-native-keyboard-spacer'
import { createStackNavigator } from 'react-navigation-stack'
import { createDrawerNavigator } from 'react-navigation-drawer'
import { createAppContainer, createSwitchNavigator } from 'react-navigation'

import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as Speech from 'expo-speech';
import * as Expo from 'expo';

import firebase from 'firebase'
import { firebaseConfig } from './firebaseConfig'
import WelcomeScreen from './screens/WelcomeScreen.js'
import LoginScreen from './screens/LoginScreen.js'
import User_Profile from './screens/ProfileScreen.js'

// initialize firebase app
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get ref to firebase cloud storage
var storage = firebase.storage()

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
})

const filterBotMessages = message =>
  !message.system && message.user && message.user._id && message.user._id === 2
const findStep = step => message => message._id === step

const user = {
  _id: 1,
  name: 'Developer',
}

const otherUser = {
  _id: 2,
  name: 'React Native',
  avatar: 'https://facebook.github.io/react/img/logo_og.png',
}

class App extends Component {
  state = {
    inverted: false,
    step: messagesData.length,
    messages: [],
    loadEarlier: false,
    typingText: null,
    isLoadingEarlier: false,
    isTyping: false,
    location: {
      coords: {
        latitude: null,
        longitude: null
      }
    },
    user: null,
    homeAddress: null,
    errorMessage: "",
    mute: false,
  }

  _isMounted = false


  componentDidMount() {
    this._isMounted = true

    this.setState({
      user: firebase.auth().currentUser
    })

    const app = this;
    var userRef = firebase.database().ref(`users/${firebase.auth().currentUser.providerData[0].uid}`);
    userRef.on('value', function(snapshot) {
      app.setState({
        homeAddress: snapshot.val() ? snapshot.val().homeAddress : '1100 N University Ave, Ann Arbor, MI 48109',
      })
    });

    // ask for location permission
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }

    // init with only system messages
    this.setState({
      messages: messagesData, // messagesData.filter(message => message.system),
      isTyping: false,
    })
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      // location permissions denied, display system message
      const step = this.state.step + 2
      this.setState((previousState: any) => {
        let response = [] as unknown
          response = [{
            _id: step,
            text: "Location permissions were denied. Please enable permissions for the best experience!",
            createdAt: new Date(),
            system: true
          }] as unknown
        return {
          step,
          messages: GiftedChat.append(
            previousState.messages,
            response as IMessage[]
          )
        }
      })

    } else {
      let location = await Location.getCurrentPositionAsync({});
      this.setState({ location });
    }
  };

  onMutePress = () => {
    this.setState((prevState) => ({ mute: !prevState.mute }))
  }

  onLoadEarlier = () => {
    this.setState(() => {
      return {
        isLoadingEarlier: true,
      }
    })

    setTimeout(() => {
      if (this._isMounted === true) {
        this.setState((previousState: any) => {
          return {
            messages: GiftedChat.prepend(
              previousState.messages,
              null,
              Platform.OS !== 'web',
            ),
            loadEarlier: false,
            isLoadingEarlier: false,
          }
        })
      }
    }, 1000) // simulating network
  }

  dialogToken = ""

  onSend = (messages = []) => {
    console.log(messages);
    const step = this.state.step + 1
    this.setState((previousState: any) => {
      const sentMessages = [{ ...messages[0], sent: false, received: false }]
      return {
        messages: GiftedChat.append(
          previousState.messages,
          sentMessages,
          Platform.OS !== 'web',
        ),
        step,
      }
    })

    const url = "https://api.clinc.ai/v1/query/"

    const data = JSON.stringify({
      "query": messages[0].text,
      "dialog": this.dialogToken,
      "lat": this.state.location.coords.latitude,
      "lon": this.state.location.coords.longitude,
      "user": this.state.user,
      "homeAddress": this.state.homeAddress,
      "time_offset": 0,
      "device": "Alexa"
    });

    var xhr = new XMLHttpRequest();

    const app = this;
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        try {
          var jsonResponse = JSON.parse(this.responseText);
          app.dialogToken = jsonResponse.dialog;
          console.log(jsonResponse);

          if (jsonResponse.visuals) {
            if (!app.state.mute) {
            Speech.speak(jsonResponse.visuals.speakableResponse, {language: 'en', pitch: 1,
              voice: "com.apple.ttsbundle.Daniel-compact"});
            }

              // Add route image if needed
              if (((jsonResponse.bl_resp || {}).slots || {})._ROUTE_NAME_) {
                let route = jsonResponse.bl_resp.slots._ROUTE_NAME_.values[0].route_code;
                storage.ref("bus_routes/" + route.toLowerCase() + ".png")
                        .getDownloadURL()
                        .then(function(url) {
                          app.setState((previousState: any) => {
                            // Parse response newlines
                            let text = "";
                            let split_text = jsonResponse.visuals.formattedResponse.split("\\n");
                            for (var i = 0; i < split_text.length; i++) {
                              text += split_text[i]
                              if (i !== split_text.length - 1) {
                                text += "\n"
                              }
                            }

                            // Parse response new message breaks
                            let split_messages = [];
                            let resplit_text = text.split("\\m");
                            for (var i = 0; i < resplit_text.length; i++) {
                              split_messages.push({
                                _id: Math.round(Math.random() * 1000000),
                                text: resplit_text[i],
                                createdAt: new Date(),
                                user: {
                                  _id: 2,
                                  name: 'Magicker Bus',
                                  avatar: 'https://www.bing.com/th?id=AMMS_908e2971907c8f8a1d59b8d0b64103de&w=110&h=110&c=7&rs=1&qlt=80&pcl=f9f9f9&cdv=1&dpr=2&pid=16.1'
                                },
                              });
                            }

                            let response_1 = []
                              response_1 = [{
                                _id: app.state.step + 2,
                                text: "",
                                image: url.toString(),
                                createdAt: new Date(),
                                user: {
                                  _id: 2,
                                  name: 'Magicker Bus',
                                  avatar: 'https://www.bing.com/th?id=AMMS_908e2971907c8f8a1d59b8d0b64103de&w=110&h=110&c=7&rs=1&qlt=80&pcl=f9f9f9&cdv=1&dpr=2&pid=16.1'
                                },
                              }];
                              response_2 = response_1.concat(split_messages)
                            return {
                              messages: GiftedChat.append(
                                previousState.messages,
                                response_2 as IMessage[]
                              )
                            }
                            })
                        });
              }
              else {
                app.setState((previousState: any) => {
                  // Parse response newlines
                  let text = "";
                  let split_text = jsonResponse.visuals.formattedResponse.split("\\n");
                  for (var i = 0; i < split_text.length; i++) {
                    text += split_text[i]
                    if (i !== split_text.length - 1) {
                      text += "\n"
                    }
                  }

                  // Parse response new message breaks
                  let split_messages = [];
                  let resplit_text = text.split("\\m");
                  for (var i = 0; i < resplit_text.length; i++) {
                    split_messages.push({
                      _id: Math.round(Math.random() * 1000000),
                      text: resplit_text[i],
                      createdAt: new Date(),
                      user: {
                        _id: 2,
                        name: 'Magicker Bus',
                        avatar: 'https://www.bing.com/th?id=AMMS_908e2971907c8f8a1d59b8d0b64103de&w=110&h=110&c=7&rs=1&qlt=80&pcl=f9f9f9&cdv=1&dpr=2&pid=16.1'
                      },
                    });
                  }

                      let response = [] as unknown
                        response = [{
                          _id: app.state.step + 2,
                          text: text,
                          createdAt: new Date(),
                          user: {
                            _id: 2,
                            name: 'Magicker Bus',
                            avatar: 'https://www.bing.com/th?id=AMMS_908e2971907c8f8a1d59b8d0b64103de&w=110&h=110&c=7&rs=1&qlt=80&pcl=f9f9f9&cdv=1&dpr=2&pid=16.1'
                          },
                        }] as unknown

                        return {
                          messages: GiftedChat.append(
                            previousState.messages,
                            response as IMessage[]
                          )
                        }
                })
              }

          } else if (jsonResponse.message) {
            Speech.speak(jsonResponse.message, {language: 'en', pitch: 1,
              voice: "com.apple.ttsbundle.Daniel-compact"});

            app.setState((previousState: any) => {
              let response = [] as unknown
                response = [{
                  _id: app.state.step + 2,
                  text: jsonResponse.message,
                  createdAt: new Date(),
                  system: true,
                }] as unknown
              return {
                messages: GiftedChat.append(
                  previousState.messages,
                  response as IMessage[]
                )
              }
            })
          } else {
            const message = 'An error occured.'
            Speech.speak(message, {language: 'en', pitch: 1,
              voice: "com.apple.ttsbundle.Daniel-compact"});

            app.setState((previousState: any) => {
              let response = [] as unknown
                response = [{
                  _id: app.state.step + 2,
                  text: message,
                  createdAt: new Date(),
                  system: true,
                }] as unknown
              return {
                messages: GiftedChat.append(
                  previousState.messages,
                  response as IMessage[]
                )
              }
            })
          }
        } catch (error) {
          console.log("ERROR")
          console.log(error)
        }
      }
    });

    xhr.onerror = function(e) {
      console.log(e);
    };

    xhr.open("POST", url);

    // When using a Clinc API Key
    xhr.setRequestHeader("Authorization", "app-key 9f9c551de45f499c5c291472d2779ac7b497e9b9");

    xhr.setRequestHeader("Content-Type", "application/json");
    console.log('data', data)
    xhr.send(data);
  }

  parsePatterns = (_linkStyle: any) => {
    return [
      {
        pattern: /#(\w+)/,
        style: { textDecorationLine: 'underline', color: 'darkorange' },
        onPress: () => Linking.openURL('http://gifted.chat'),
      },
    ]
  }

  renderCustomView(props) {
    return <CustomView {...props} />
  }

  onReceive = (text: string) => {
    this.setState((previousState: any) => {
      return {
        messages: GiftedChat.append(
          previousState.messages as any,
          [
            {
              _id: Math.round(Math.random() * 1000000),
              text,
              createdAt: new Date(),
              user: otherUser,
            },
          ],
          Platform.OS !== 'web',
        ),
      }
    })
  }

  onSendFromUser = (messages = []) => {
    const createdAt = new Date()
    const messagesToUpload = messages.map(message => ({
      ...message,
      user,
      createdAt,
      _id: Math.round(Math.random() * 1000000),
    }))
    this.onSend(messagesToUpload)
  }

  setIsTyping = () => {
    this.setState({
      isTyping: !this.state.isTyping,
    })
  }

  renderAccessory = () => (
    <AccessoryBar onSend={this.onSendFromUser} isTyping={this.setIsTyping} />
  )

  renderCustomActions = props =>
    Platform.OS === 'web' || Platform.OS === 'android' ? null : (
      <CustomActions {...props} onSend={this.onSendFromUser} />
    )

  renderBubble = (props: any) => {
    return <Bubble {...props} onSendFromUser={this.onSendFromUser} />
  }

  renderSystemMessage = props => {
    return (
      <SystemMessage
        {...props}
        containerStyle={{
          marginBottom: 15,
        }}
        textStyle={{
          fontSize: 14,
        }}
      />
    )
  }

  // renderFooter = props => {
  //   if (this.state.typingText) {
  //     return (
  //       <View style={styles.footerContainer}>
  //         <Text style={styles.footerText}>{this.state.typingText}</Text>
  //       </View>
  //     )
  //   }
  //   return null
  // }

  onQuickReply = replies => {
    const createdAt = new Date()
    if (replies.length === 1) {
      this.onSend([
        {
          createdAt,
          _id: Math.round(Math.random() * 1000000),
          text: replies[0].title,
          user,
        },
      ])
    } else if (replies.length > 1) {
      this.onSend([
        {
          createdAt,
          _id: Math.round(Math.random() * 1000000),
          text: replies.map(reply => reply.title).join(', '),
          user,
        },
      ])
    } else {
      console.warn('replies param is not set correctly')
    }
  }

  renderQuickReplySend = () => <Text>{' custom send =>'}</Text>

  render() {
    return (
      <View
        style={styles.container}
        accessible
        accessibilityLabel='main'
        testID='main'
      >
        <NavBar
          onMute={this.onMutePress}
          mute={this.state.mute}
        />
        <GiftedChat
          messages={this.state.messages}
          onSend={this.onSend}
          loadEarlier={this.state.loadEarlier}
          onLoadEarlier={this.onLoadEarlier}
          isLoadingEarlier={this.state.isLoadingEarlier}
          parsePatterns={this.parsePatterns}
          user={user}
          scrollToBottom
          onLongPressAvatar={user => alert(JSON.stringify(user))}
          onPressAvatar={() => alert('short press')}
          onQuickReply={this.onQuickReply}
          keyboardShouldPersistTaps='never'
          renderAccessory={null} // {Platform.OS === 'web' ? null : this.renderAccessory}
          renderActions={this.renderCustomActions}
          renderBubble={this.renderBubble}
          renderSystemMessage={this.renderSystemMessage}
          renderCustomView={this.renderCustomView}
          quickReplyStyle={{ borderRadius: 2 }}
          renderQuickReplySend={this.renderQuickReplySend}
          inverted={Platform.OS !== 'web'}
          timeTextStyle={{ left: { color: 'black' }, right: { color: 'white' } }}
          isTyping={this.state.isTyping}
        />
        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    )
  }
}

// App navigation
const AppNavigator = createDrawerNavigator({
  "Magicker Bus" : {
    screen: App,
    navigationOptions: ({ navigation }) => ({
      // headerRight: () => <Button onPress={() => this.props.navigation.navigate({routeName: 'Profile'})} title="Profile!"></Button>
    }),
  },
  Profile : {
    screen: User_Profile,
    navigationOptions: ({ navigation }) => ({
      // headerRight: () => <Button onPress={() => this.props.navigation.navigate('App')} title="Go to Test"></Button>
    }),
  }
})

const AppSwitchNavigator = createSwitchNavigator({
  WelcomeScreen: WelcomeScreen,
  LoginScreen: LoginScreen,
  DashboardScreen : AppNavigator
})

const AppContainer = createAppContainer(AppSwitchNavigator)
export default AppContainer
