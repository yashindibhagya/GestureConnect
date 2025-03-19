import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Video } from 'expo-av';
import { VideoContext } from '../../context/VideoContext';
import * as FileSystem from 'expo-file-system';

export default function TextToSign() {
  const [inputText, setInputText] = useState('');
  const [translatedSigns, setTranslatedSigns] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playlistReady, setPlaylistReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { getSignVideoByWord, isLoading, signsData } = useContext(VideoContext);
  const videoRef = useRef(null);

  // Handle text translation to sign videos
  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setPlaylistReady(false);

    // Split text into words and find corresponding signs
    const words = inputText.toLowerCase().trim().split(/\s+/);
    const signs = words.map(word => {
      // Remove punctuation from word
      const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const sign = getSignVideoByWord(cleanWord);

      if (sign) {
        return {
          word: sign.word,
          videoUrl: sign.videoUrl,
          notFound: false
        };
      }

      return {
        word: cleanWord,
        notFound: true
      };
    });

    setTranslatedSigns(signs);

    // Filter out non-found videos and create a playlist
    const validSigns = signs.filter(sign => !sign.notFound);
    if (validSigns.length > 0) {
      const playlist = validSigns.map(sign => sign.videoUrl);
      setCurrentPlaylist(playlist);
      setCurrentVideoIndex(0);
      setPlaylistReady(true);
    }

    setIsTranslating(false);
  };

  // Handle video playback status updates
  const handleVideoStatusUpdate = (status) => {
    if (status.didJustFinish && isPlaying) {
      // Move to the next video in the playlist
      const nextIndex = currentVideoIndex + 1;
      if (nextIndex < currentPlaylist.length) {
        setCurrentVideoIndex(nextIndex);
      } else {
        // End of playlist
        setIsPlaying(false);
      }
    }
  };

  // Start playback of the current video
  const startPlayback = async () => {
    if (videoRef.current && playlistReady) {
      setIsPlaying(true);
      await videoRef.current.playAsync();
    }
  };

  // Stop playback
  const stopPlayback = async () => {
    if (videoRef.current) {
      setIsPlaying(false);
      await videoRef.current.pauseAsync();
      await videoRef.current.setPositionAsync(0);
    }
  };

  // Reset playback to beginning
  const resetPlayback = async () => {
    setCurrentVideoIndex(0);
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      await videoRef.current.setPositionAsync(0);
      await videoRef.current.playAsync();
    } else {
      await videoRef.current.setPositionAsync(0);
    }
  };

  // Get the currently playing word
  const getCurrentWord = () => {
    if (!playlistReady || currentPlaylist.length === 0) return "";

    const currentUrl = currentPlaylist[currentVideoIndex];
    const sign = translatedSigns.find(sign => !sign.notFound && sign.videoUrl === currentUrl);
    return sign ? sign.word : "";
  };

  // Load the current video when index changes
  React.useEffect(() => {
    const loadCurrentVideo = async () => {
      if (videoRef.current && playlistReady && currentPlaylist.length > 0) {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync(
          { uri: currentPlaylist[currentVideoIndex] },
          { shouldPlay: isPlaying }
        );
      }
    };

    loadCurrentVideo();
  }, [currentVideoIndex, playlistReady, currentPlaylist]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C9EFF" />
        <Text>Loading sign language data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Text to Sign Language</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter text to translate..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={styles.translateButton}
          onPress={handleTranslate}
          disabled={isTranslating || !inputText.trim()}
        >
          <Text style={styles.buttonText}>Translate</Text>
        </TouchableOpacity>
      </View>

      {isTranslating ? (
        <ActivityIndicator size="large" color="#4C9EFF" />
      ) : translatedSigns.length > 0 ? (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Translation Results:</Text>

          {/* Word chips to show the translated words */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.wordChipsContainer}
          >
            {translatedSigns.map((sign, index) => (
              <View
                key={`word-${index}`}
                style={[
                  styles.wordChip,
                  sign.notFound ? styles.wordChipNotFound : {},
                  currentPlaylist[currentVideoIndex] === sign.videoUrl && isPlaying ? styles.wordChipActive : {}
                ]}
              >
                <Text
                  style={[
                    styles.wordChipText,
                    sign.notFound ? styles.wordChipTextNotFound : {},
                    currentPlaylist[currentVideoIndex] === sign.videoUrl && isPlaying ? styles.wordChipTextActive : {}
                  ]}
                >
                  {sign.word}
                </Text>
              </View>
            ))}
          </ScrollView>

          {playlistReady && currentPlaylist.length > 0 ? (
            <View style={styles.videoPlayerContainer}>
              <Text style={styles.nowPlayingText}>
                Now signing: <Text style={styles.currentWordText}>{getCurrentWord()}</Text>
                {" "}{currentVideoIndex + 1}/{currentPlaylist.length}
              </Text>

              <Video
                ref={videoRef}
                style={styles.videoPlayer}
                resizeMode="contain"
                useNativeControls={false}
                isLooping={false}
                onPlaybackStatusUpdate={handleVideoStatusUpdate}
              />

              <View style={styles.videoControls}>
                {isPlaying ? (
                  <TouchableOpacity style={styles.controlButton} onPress={stopPlayback}>
                    <Text style={styles.controlButtonText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.controlButton} onPress={startPlayback}>
                    <Text style={styles.controlButtonText}>Play</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.controlButton} onPress={resetPlayback}>
                  <Text style={styles.controlButtonText}>Restart</Text>
                </TouchableOpacity>
              </View>

              {/* Video progress indicator */}
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(currentVideoIndex / (currentPlaylist.length - 1)) * 100}%` }
                  ]}
                />
              </View>
            </View>
          ) : translatedSigns.every(sign => sign.notFound) ? (
            <Text style={styles.noVideoText}>
              No sign language videos available for these words.
            </Text>
          ) : null}

          <Text style={styles.translatedWordsTitle}>All Translated Words:</Text>
          {translatedSigns.map((sign, index) => (
            <View
              key={`sign-${index}`}
              style={sign.notFound ? styles.notFoundCard : styles.signCard}
            >
              <Text style={sign.notFound ? styles.notFoundText : styles.signWord}>
                {sign.word}
              </Text>
              {sign.notFound && (
                <Text style={styles.notFoundSubtext}>Sign not available</Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : inputText.trim() ? (
        <Text style={styles.noResults}>
          No translation available. Try different words or phrases.
        </Text>
      ) : null}

      <View style={styles.recentContainer}>
        <Text style={styles.recentTitle}>Recent Translations</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  translateButton: {
    backgroundColor: '#4C9EFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  wordChipsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  wordChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  wordChipNotFound: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  wordChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  wordChipText: {
    fontSize: 14,
    color: '#1976D2',
  },
  wordChipTextNotFound: {
    color: '#D32F2F',
  },
  wordChipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  videoPlayerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nowPlayingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentWordText: {
    fontWeight: 'bold',
    color: '#4C9EFF',
  },
  videoPlayer: {
    width: '100%',
    height: 250,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  controlButton: {
    backgroundColor: '#4C9EFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4C9EFF',
    borderRadius: 2,
  },
  noVideoText: {
    textAlign: 'center',
    margin: 20,
    color: '#D32F2F',
    fontSize: 16,
  },
  translatedWordsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  signCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notFoundCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signWord: {
    fontSize: 16,
    fontWeight: '500',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D32F2F',
  },
  notFoundSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  recentContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#4C9EFF',
    fontWeight: '500',
  },
});