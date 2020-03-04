import PropTypes from 'prop-types'
import React from 'react'

import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes,
} from 'react-native'

import { FontAwesome } from '@expo/vector-icons';

const speechToTextApiUrl = 'https://us-central1-driven-tape-270104.cloudfunctions.net/audioToText';

export default class CustomActions extends React.Component {
  recording = null;
  sound = null;
  recordingSettings = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.wav',
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  }
  state = {
    haveRecordingPermissions: false,
    isLoading: false,
    isRecording: false,
    isPlaybackAllowed: false,
    shouldPlay: false,
    isPlaying: false,
    shouldCorrectPitch: true,
    volume: 1.0,
    rate: 1.0
  }

  async componentDidMount() {
    this._askForPermissions();
  }

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === 'granted',
    });
  };

  _updateScreenForRecordingStatus = status => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis,
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis,
      });
      if (!this.state.isLoading) {
        this._stopRecordingAndEnablePlayback();
      }
    }
  };

  async _stopPlaybackAndBeginRecording() {
    this.setState({
      isLoading: true,
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(this.recordingSettings);
    recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus);

    this.recording = recording;
    await this.recording.startAsync();
    this.setState({
      isLoading: false,
    });
  }

  async _stopRecordingAndEnablePlayback() {
    this.setState({
      isLoading: true,
    });
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {

    }
    const info = await FileSystem.getInfoAsync(this.recording.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    const { sound, status } = await this.recording.createNewLoadedSoundAsync(
      {
        isLooping: false,
        isMuted: this.state.muted,
        volume: this.state.volume,
        rate: this.state.rate,
        shouldCorrectPitch: this.state.shouldCorrectPitch,
      },
      this._updateScreenForSoundStatus
    );
    this.sound = sound;
    // this._onPlayPausePressed();
    this.setState({
      isLoading: false,
    });
  }

  _onRecordPressed = () => {
    if (this.state.isRecording) {
      this._stopRecordingAndEnablePlayback();
      this.getTranscription();
    } else {
      this._stopPlaybackAndBeginRecording();
    }
  };

  _onPlayPausePressed = () => {
    console.log("pressed")
    if (this.sound != null) {
      console.log("sound exists")
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
      } else {
        this.sound.playAsync();
        console.log("playing");
      }
    }
  };

  getTranscription = async () => {
    const { onSend, onRecord } = this.props
    this.setState({ isFetching: true });
    try {
      const info = await FileSystem.getInfoAsync(this.recording.getURI());
      console.log(`FILE INFO: ${JSON.stringify(info)}`);
      const uri = info.uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/x-wav',
        name: 'audio_input'
      });
      const response = await fetch(speechToTextApiUrl, {
        method: 'POST',
        body: formData
      });

      await response.json().then((data) => {
        onSend([{ text: data.transcript }]);
      });

    } catch (error) {
      console.log('There was an error', error);
    }
    this.setState({ isFetching: false });
  }

  renderIcon = () => {
    if (this.props.renderIcon) {
      return this.props.renderIcon()
    }
    return (
      <FontAwesome style={[this.state.isRecording === true ? styles.microphoneIconActive : styles.microphoneIcon]} name={'microphone'} onPress={this._onRecordPressed} />
    )
  }

  render() {
    return (
      <TouchableOpacity
        style={[styles.container, this.props.containerStyle]}
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
  microphoneIconActive: {
    color: 'red',
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
})

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
}

CustomActions.defaultProps = {
  onSend: () => { },
  onRecord: () => { },
  options: {},
  renderIcon: null,
  containerStyle: {},
  wrapperStyle: {},
  iconTextStyle: {},
}

CustomActions.propTypes = {
  onSend: PropTypes.func,
  onRecord: PropTypes.func,
  options: PropTypes.object,
  renderIcon: PropTypes.func,
  containerStyle: ViewPropTypes.style,
  wrapperStyle: ViewPropTypes.style,
  iconTextStyle: Text.propTypes.style,
}
