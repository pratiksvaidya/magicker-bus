import PropTypes from 'prop-types'
import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes,
} from 'react-native'

import {
  getLocationAsync,
  pickImageAsync,
  takePictureAsync,
} from './mediaUtils'

import { FontAwesome } from '@expo/vector-icons';

export default class CustomActions extends React.Component {
  onActionsPress = () => {
    const options = [
      // 'Choose From Library',
      // 'Take Picture',
      // 'Send Location',
      'Call Billy',
      'Cancel',
    ]
    const cancelButtonIndex = options.length - 1
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async buttonIndex => {
        const { onSend } = this.props
        switch (buttonIndex) {
          case 0:
            // pickImageAsync(onSend)
            return
          // case 1:
          //   takePictureAsync(onSend)
          //   return
          // case 2:
          //   getLocationAsync(onSend)
          default:
        }
      },
    )
  }

  renderIcon = () => {
    if (this.props.renderIcon) {
      return this.props.renderIcon()
    }
    return (
      <FontAwesome style={[styles.microphoneIcon]} name={'microphone'} />
    )
  }

  render() {
    return (
      <TouchableOpacity
        style={[styles.container, this.props.containerStyle]}
        onPress={this.onActionsPress}
      >
        {this.renderIcon()}
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginRight: 10,
    marginBottom: 10,
  },
  microphoneIcon: {
    color: '#b2b2b2',
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: 'transparent',

  },
})

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
}

CustomActions.defaultProps = {
  onSend: () => {},
  options: {},
  renderIcon: null,
  containerStyle: {},
  wrapperStyle: {},
  iconTextStyle: {},
}

CustomActions.propTypes = {
  onSend: PropTypes.func,
  options: PropTypes.object,
  renderIcon: PropTypes.func,
  containerStyle: ViewPropTypes.style,
  wrapperStyle: ViewPropTypes.style,
  iconTextStyle: Text.propTypes.style,
}
