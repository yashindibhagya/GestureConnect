import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";

import Common from "../../Components/Container/Common";
import Button from "../../Components/Shared/Button";
import SignLanguageCamera from "../../Components/SignLanguage/SignLanguageCamera";
import signLanguageService from "../../services/signLanguageService";

// Firebase imports
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

const STORAGE_FILE = "savedSignTranslations.json";
const MAX_RECENT = 10;

/**
 * Sign-to-text screen.
 *
 * The camera streams continuously to the model server, which appends each recognised
 * sign to a rolling sentence. Nothing stops after a single word and there is no
 * recording time limit — the user signs until they press stop.
 */
export default function SignToText() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isSigning, setIsSigning] = useState(false);
  const [sentence, setSentence] = useState("");
  const [detectedSigns, setDetectedSigns] = useState([]);
  const [liveWord, setLiveWord] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [connectionState, setConnectionState] = useState("idle");
  const [serverError, setServerError] = useState(null);

  const [translationHistory, setTranslationHistory] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  const [showUndoToast, setShowUndoToast] = useState(false);
  const [deletedConversation, setDeletedConversation] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => {
    loadSavedTranslations();

    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storagePath = FileSystem.documentDirectory + STORAGE_FILE;

  // -- persistence ----------------------------------------------------------

  const loadSavedTranslations = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(storagePath);

      if (fileInfo.exists) {
        const savedData = await FileSystem.readAsStringAsync(storagePath);
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) setTranslationHistory(parsed);
      }

      if (auth.currentUser) {
        const conversationsRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "signConversations"
        );
        const snapshot = await getDocs(conversationsRef);

        if (!snapshot.empty) {
          const firestoreData = snapshot.docs.map(d => d.data());
          setTranslationHistory(firestoreData);
          await FileSystem.writeAsStringAsync(
            storagePath,
            JSON.stringify(firestoreData)
          );
        }
      }
    } catch (error) {
      console.error("Error loading saved translations:", error);
    }
  };

  const persist = async history => {
    setTranslationHistory(history);
    try {
      await FileSystem.writeAsStringAsync(storagePath, JSON.stringify(history));
    } catch (error) {
      console.error("Error writing saved translations:", error);
    }
  };

  // -- recognition ----------------------------------------------------------

  const handlePrediction = useCallback(data => {
    // The server owns the sentence, so the screen just mirrors what it sends.
    setSentence(data.sentence || "");
    setDetectedSigns(data.words || []);
    setLiveWord(data.word || null);
    setConfidence(data.confidence || 0);

    // Any new word means the saved copy is now out of date.
    if (data.committed) setIsSaved(false);
  }, []);

  const handleStatusChange = useCallback(state => {
    setConnectionState(state);
    if (state === "connected") setServerError(null);
  }, []);

  const handleError = useCallback(message => setServerError(message), []);

  const toggleSigning = () => {
    setIsSigning(prev => !prev);
  };

  const clearTranslation = () => {
    // Clear on the server too, otherwise its sentence keeps growing from where it
    // left off and reappears on the next prediction.
    signLanguageService.reset();
    setSentence("");
    setDetectedSigns([]);
    setLiveWord(null);
    setConfidence(0);
    setIsSaved(false);
  };

  const removeLastWord = () => {
    signLanguageService.backspace();
    setIsSaved(false);
  };

  // -- save / share ---------------------------------------------------------

  const saveTranslation = async () => {
    const text = sentence.trim();

    if (!text) {
      Alert.alert("Nothing to save", "Sign something first, then save it.");
      return;
    }

    const conversation = {
      text,
      timestamp: new Date().toISOString(),
      signs: detectedSigns,
    };

    try {
      if (auth.currentUser) {
        const conversationsRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "signConversations"
        );
        const newRef = doc(conversationsRef);

        const conversationData = {
          ...conversation,
          id: newRef.id,
          userId: auth.currentUser.uid,
        };

        await setDoc(newRef, conversationData);
        await persist([conversationData, ...translationHistory].slice(0, MAX_RECENT));
        setIsSaved(true);
        Alert.alert("Saved", "Translation saved to your account.");
      } else {
        // Auth is currently bypassed, so a local id keeps delete/undo working.
        const conversationData = {
          ...conversation,
          id: `local-${Date.now()}`,
        };

        await persist([conversationData, ...translationHistory].slice(0, MAX_RECENT));
        setIsSaved(true);
        Alert.alert("Saved", "Translation saved to this device.");
      }
    } catch (error) {
      console.error("Error saving translation:", error);
      Alert.alert("Error", "Failed to save translation. Please try again.");
    }
  };

  const deleteTranslation = async index => {
    try {
      const itemToDelete = translationHistory[index];
      setDeletedConversation({ item: itemToDelete, index });

      const updated = translationHistory.filter((_, i) => i !== index);
      await persist(updated);

      if (auth.currentUser && itemToDelete.id && !itemToDelete.id.startsWith("local-")) {
        await deleteDoc(
          doc(db, "users", auth.currentUser.uid, "signConversations", itemToDelete.id)
        );
      }

      setShowUndoToast(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setShowUndoToast(false);
        setDeletedConversation(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting translation:", error);
      Alert.alert("Error", "Failed to delete translation. Please try again.");
    }
  };

  const undoDelete = async () => {
    if (!deletedConversation) return;

    try {
      const restored = [...translationHistory];
      restored.splice(deletedConversation.index, 0, deletedConversation.item);
      await persist(restored);

      const { item } = deletedConversation;
      if (auth.currentUser && item.id && !item.id.startsWith("local-")) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid, "signConversations", item.id),
          item
        );
      }
    } catch (error) {
      console.error("Error restoring translation:", error);
    } finally {
      setShowUndoToast(false);
      setDeletedConversation(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    }
  };

  const shareTranslation = async () => {
    if (!sentence) return;

    try {
      await Share.share({ message: `Sign Language Translation: ${sentence}` });
    } catch (error) {
      console.error("Error sharing translation:", error);
    }
  };

  const formatStamp = value => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const hasText = sentence.trim().length > 0;
  const canSign = isSigning || connectionState === "connected";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // Clear the floating tab bar and the home indicator.
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Common />

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Sign Language to Text</Text>
          <Text style={styles.subtitle}>
            Keep signing — words are added to the sentence as they are recognised.
          </Text>

          <TouchableOpacity
            style={styles.savedButton}
            onPress={() => router.push("/saveSign/savedTranslations")}
          >
            <MaterialIcons name="history" size={20} color="#155658" />
            <Text style={styles.savedButtonText}>View Saved Translations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <SignLanguageCamera
            isRecording={isSigning}
            onPrediction={handlePrediction}
            onStatusChange={handleStatusChange}
            onError={handleError}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            isSigning && styles.primaryButtonActive,
            !canSign && styles.primaryButtonDisabled,
          ]}
          onPress={toggleSigning}
          // Starting before the socket is up would capture frames with nowhere to
          // send them; stopping stays available either way.
          disabled={!canSign}
        >
          <MaterialIcons
            name={isSigning ? "stop" : "videocam"}
            size={22}
            color="#fff"
          />
          <Text style={styles.primaryButtonText}>
            {isSigning
              ? "Stop signing"
              : canSign
                ? "Start signing"
                : "Connecting to model…"}
          </Text>
        </TouchableOpacity>

        {serverError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color="#8a1c1c" />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        <View style={styles.translationBoxContainer}>
          <View style={styles.translationHeader}>
            <Text style={styles.translationLabel}>Translation</Text>

            {isSigning && liveWord && (
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>
                  {liveWord} {Math.round(confidence * 100)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textBoxContainer}>
            {hasText ? (
              <Text style={styles.translationText} selectable>
                {sentence}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isSigning
                  ? "Watching for signs…"
                  : "Press Start signing and your words will appear here."}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            <Button
              text="Clear"
              onPress={clearTranslation}
              type="outline"
              style={styles.actionButton}
              disabled={!hasText}
            />

            <TouchableOpacity
              style={[styles.actionIconButton, !hasText && styles.disabledButton]}
              onPress={removeLastWord}
              disabled={!hasText}
            >
              <MaterialIcons
                name="backspace"
                size={18}
                color={!hasText ? "#aaa" : "#155658"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionIconButton,
                (!hasText || isSaved) && styles.disabledButton,
              ]}
              onPress={saveTranslation}
              disabled={!hasText || isSaved}
            >
              <MaterialIcons
                name={isSaved ? "check" : "save"}
                size={18}
                color={!hasText || isSaved ? "#aaa" : "#155658"}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  (!hasText || isSaved) && styles.disabledText,
                ]}
              >
                {isSaved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIconButton, !hasText && styles.disabledButton]}
              onPress={shareTranslation}
              disabled={!hasText}
            >
              <MaterialIcons
                name="share"
                size={18}
                color={!hasText ? "#aaa" : "#155658"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {detectedSigns.length > 0 && (
          <View style={styles.recentSignsContainer}>
            <Text style={styles.recentSignsLabel}>Detected Signs</Text>
            <View style={styles.signBadgesContainer}>
              {detectedSigns.slice(-12).map((sign, index, visible) => (
                <View
                  key={`${sign}-${index}`}
                  style={[
                    styles.signBadge,
                    index === visible.length - 1 && styles.lastSignBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.signBadgeText,
                      index === visible.length - 1 && styles.lastSignBadgeText,
                    ]}
                  >
                    {sign}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {translationHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Translations</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/saveSign/savedTranslations")}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <AntDesign name="right" size={14} color="#155658" />
              </TouchableOpacity>
            </View>

            {translationHistory.slice(0, 3).map((item, index) => (
              <View key={item.id || index} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyTime}>{formatStamp(item.timestamp)}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteTranslation(index)}
                  >
                    <AntDesign name="close" size={16} color="#999" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.historyText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showUndoToast && (
        <View style={[styles.undoToast, { bottom: 90 + insets.bottom }]}>
          <Text style={styles.undoToastText}>Translation deleted</Text>
          <TouchableOpacity onPress={undoDelete}>
            <Text style={styles.undoButton}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D0F3DA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
  },
  headerContainer: {
    paddingTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#155658",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 10,
  },
  savedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  savedButtonText: {
    color: "#155658",
    marginLeft: 5,
    fontWeight: "500",
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#222",
    marginBottom: 14,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#155658",
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
  },
  primaryButtonActive: {
    backgroundColor: "#B3261E",
  },
  primaryButtonDisabled: {
    backgroundColor: "#9BB5B5",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#8a1c1c",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  translationBoxContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  translationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  translationLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#155658",
  },
  livePill: {
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  livePillText: {
    color: "#155658",
    fontSize: 11,
    fontWeight: "700",
  },
  textBoxContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginBottom: 15,
    minHeight: 100,
    justifyContent: "flex-start",
  },
  translationText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
  },
  placeholderText: {
    fontSize: 15,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    marginRight: 8,
  },
  actionIconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 6,
  },
  actionButtonText: {
    color: "#155658",
    marginLeft: 5,
    fontWeight: "500",
    fontSize: 13,
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
  },
  disabledText: {
    color: "#aaa",
  },
  recentSignsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  recentSignsLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#155658",
    marginBottom: 10,
  },
  signBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  signBadge: {
    backgroundColor: "#E0F2F1",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 3,
  },
  lastSignBadge: {
    backgroundColor: "#26A69A",
  },
  signBadgeText: {
    color: "#155658",
    fontSize: 12,
    fontWeight: "bold",
  },
  lastSignBadgeText: {
    color: "#fff",
  },
  historyContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#155658",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: "#155658",
    fontSize: 14,
    marginRight: 5,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  historyTime: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 5,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
  },
  undoToast: {
    position: "absolute",
    left: 25,
    right: 25,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  undoToastText: {
    color: "#fff",
    fontSize: 14,
  },
  undoButton: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 14,
  },
});
