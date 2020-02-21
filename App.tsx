import 'react-native-gesture-handler'
import { AppLoading, Asset, Linking } from 'expo'
import React, { Component } from 'react'
import { StyleSheet, View, Text, Platform, Button, AppRegistry } from 'react-native'
import { Bubble, GiftedChat, SystemMessage, IMessage } from './src'

import AccessoryBar from './example-expo/AccessoryBar'
import CustomActions from './example-expo/CustomActions'
import CustomView from './example-expo/CustomView'
import messagesData from './example-expo/data/messages'
import { createStackNavigator } from 'react-navigation-stack'
import { createAppContainer, createSwitchNavigator } from 'react-navigation'

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    step: 0,
    messages: [],
    loadEarlier: false,
    typingText: null,
    isLoadingEarlier: false,
    appIsReady: false,
    isTyping: false,
  }

  _isMounted = false

  // static navigationOptions = {
  //   headerTitle: () => <Text>
  //     TEST COMPONENT
  //   </Text>,
  //   headerRight: ({ navigation }) => (
  //     <Button
  //       onPress={() => navigation.navigate('Profile')}
  //       title="Info"
  //     />
  //   ),
  // };

  componentDidMount() {
    this._isMounted = true
    // init with only system messages
    this.setState({
      messages: messagesData, // messagesData.filter(message => message.system),
      appIsReady: true,
      isTyping: false,
    })
  }

  componentWillUnmount() {
    this._isMounted = false
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

  onSend = (messages = []) => {
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
      "query": messages[0],
    });

    var xhr = new XMLHttpRequest();

    const app = this;
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        var jsonResponse = JSON.parse(this.responseText);
        console.log(this.responseText);

        app.setState((previousState: any) => {
          let response = [] as unknown
            response = [{
              _id: app.state.step + 2,
              text: jsonResponse.visuals.formattedResponse,
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
    });

    xhr.open("POST", url);

    // When using a Bearer token
    xhr.setRequestHeader("Authorization", "Bearer m2aBKRZ3sAD7ZT6s0WAZOk4mjwcaAB"); // <MANUALLY UPDATE AUTH TOKEN FOR NOW>
    // When using a Clinc API Key
    // xhr.setRequestHeader("Authorization", "app-key RQWkiEhwqp9BU04533bnT67FXaqwd0");

    xhr.setRequestHeader("Content-Type", "application/json");

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
    Platform.OS === 'web' ? null : (
      <CustomActions {...props} onSend={this.onSendFromUser} />
    )

  renderBubble = (props: any) => {
    return <Bubble {...props} />
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
    if (!this.state.appIsReady) {
      return <AppLoading />
    }
    return (
      <View
        style={styles.container}
        accessible
        accessibilityLabel='main'
        testID='main'
      >
        <Button onPress={() => this.props.navigation.navigate('Profile')} title="Profile"></Button>
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
      </View>
    )
  }
}

class User_Profile extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>
          User info here
        </Text>
      </View>
    );
  }
}

// Switch navigator for login screen, have to restructure App component first
/**
class WelcomeScreen extends Component {
  render() {
    return (
      <View>
        <Text>Welcome Screen</Text>
      </View>
    );
  }
}

class DashboardScreen extends Component {
  render() {
    return (
      <View>
        <Text>Welcome Screen</Text>
      </View>
    );
  }
}

const AppSwitchNavigator = createSwitchNavigator({
  Welcome: {screen: WelcomeScreen},
  Dashboard: {screen: DashboardScreen}
})

const AppContainer = createAppContainer(AppSwitchNavigator) **/

const AppNavigator = createStackNavigator({
  "Magicker Bus" : {
    screen: App,
    navigationOptions: ({ navigation }) => ({
      headerRight: () => <Button onPress={() => this.props.navigation.navigate({routeName: 'Profile'})} title="Profile!"></Button>
    }),
  },
  Profile : {
    screen: User_Profile,
    navigationOptions: ({ navigation }) => ({
      // headerRight: () => <Button onPress={() => this.props.navigation.navigate('App')} title="Go to Test"></Button>
    }),
  }
})

export default createAppContainer(AppNavigator)
