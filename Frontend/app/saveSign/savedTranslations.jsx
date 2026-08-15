import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Common from "../../Components/Container/Common";
import * as FileSystem from 'expo-file-system/legacy';

// Firebase imports
import { doc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

export default function SavedTranslations() {
    const insets = useSafeAreaInsets();
    const [signTranslations, setSignTranslations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [deletedTranslation, setDeletedTranslation] = useState(null);
    const undoTimerRef = useRef(null);

    // Load saved translations on component mount
    useEffect(() => {
        loadSavedTranslations();
    }, []);

    // Load saved translations
    const loadSavedTranslations = async () => {
        setIsLoading(true);
        try {
            // Load sign translations
            await loadSignTranslations();
        } catch (error) {
            console.error("Error loading saved translations:", error);
            Alert.alert("Error", "Failed to load saved translations.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Load sign translations
    const loadSignTranslations = async () => {
        try {
            // First try to load from local storage
            const savedSignPath = FileSystem.documentDirectory + 'savedSignTranslations.json';
            const fileInfo = await FileSystem.getInfoAsync(savedSignPath);

            let translations = [];

            if (fileInfo.exists) {
                const savedData = await FileSystem.readAsStringAsync(savedSignPath);
                translations = JSON.parse(savedData);
            }

            // If user is logged in, try to load from Firestore
            if (auth.currentUser) {
                const conversationsRef = collection(db, "users", auth.currentUser.uid, "signConversations");
                const snapshot = await getDocs(conversationsRef);

                if (!snapshot.empty) {
                    const firestoreData = snapshot.docs.map(doc => doc.data());
                    // Merge with local data, prioritizing Firestore data
                    translations = [...firestoreData];

                    // Update local storage with merged data
                    await FileSystem.writeAsStringAsync(
                        savedSignPath,
                        JSON.stringify(translations)
                    );
                }
            }

            setSignTranslations(translations);
        } catch (error) {
            console.error("Error loading sign translations:", error);
            throw error;
        }
    };

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadSavedTranslations();
    };

    // Delete a translation
    const deleteTranslation = async (index) => {
        try {
            const itemToDelete = signTranslations[index];

            // Store the deleted item for potential undo
            setDeletedTranslation({
                item: itemToDelete,
                index: index
            });

            // Create a new array without the deleted item
            const updatedTranslations = [
                ...signTranslations.slice(0, index),
                ...signTranslations.slice(index + 1)
            ];

            // Update state
            setSignTranslations(updatedTranslations);

            // Update Firestore if user is logged in and item has an ID
            if (auth.currentUser && itemToDelete.id) {
                const conversationRef = doc(db, "users", auth.currentUser.uid, "signConversations", itemToDelete.id);
                await deleteDoc(conversationRef);
            }

            // Update local storage
            const storagePath = FileSystem.documentDirectory + 'savedSignTranslations.json';
            await FileSystem.writeAsStringAsync(
                storagePath,
                JSON.stringify(updatedTranslations)
            );

            // Show undo toast
            setShowUndoToast(true);

            // Clear any existing timer
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
            }

            // Set timer to hide toast after 3 seconds
            undoTimerRef.current = setTimeout(() => {
                setShowUndoToast(false);
                setDeletedTranslation(null);
            }, 3000);

        } catch (error) {
            console.error("Error deleting translation:", error);
            Alert.alert("Error", "Failed to delete translation. Please try again.");
        }
    };

    // Undo delete
    const undoDelete = async () => {
        if (!deletedTranslation) return;

        try {
            // Create a new array with the deleted item restored
            const restoredTranslations = [...signTranslations];
            restoredTranslations.splice(
                deletedTranslation.index,
                0,
                deletedTranslation.item
            );

            // Update state
            setSignTranslations(restoredTranslations);

            // Restore to Firestore if user is logged in and the item has an ID
            if (auth.currentUser && deletedTranslation.item.id) {
                const conversationRef = doc(
                    db,
                    "users",
                    auth.currentUser.uid,
                    "signConversations",
                    deletedTranslation.item.id
                );
                await setDoc(conversationRef, deletedTranslation.item);
            }

            // Update local storage
            const storagePath = FileSystem.documentDirectory + 'savedSignTranslations.json';
            await FileSystem.writeAsStringAsync(
                storagePath,
                JSON.stringify(restoredTranslations)
            );

            // Clear undo state
            setShowUndoToast(false);
            setDeletedTranslation(null);

            // Clear timer
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;
            }

        } catch (error) {
            console.error("Error restoring translation:", error);
            Alert.alert("Error", "Failed to restore translation. Please try again.");
        }
    };

    // Clear all translations
    const clearAllTranslations = async () => {
        Alert.alert(
            "Clear All Translations",
            "Are you sure you want to delete all saved translations? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Clear state
                            setSignTranslations([]);

                            // Clear Firestore if user is logged in
                            if (auth.currentUser) {
                                const conversationsRef = collection(db, "users", auth.currentUser.uid, "signConversations");
                                const snapshot = await getDocs(conversationsRef);

                                if (!snapshot.empty) {
                                    const batch = writeBatch(db);
                                    snapshot.docs.forEach(doc => {
                                        batch.delete(doc.ref);
                                    });
                                    await batch.commit();
                                }
                            }

                            // Clear local storage
                            const storagePath = FileSystem.documentDirectory + 'savedSignTranslations.json';
                            await FileSystem.writeAsStringAsync(
                                storagePath,
                                JSON.stringify([])
                            );

                            Alert.alert("Success", "All translations have been cleared.");
                        } catch (error) {
                            console.error("Error clearing translations:", error);
                            Alert.alert("Error", "Failed to clear translations. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    // Format timestamp for display
    const formatTime = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Filter translations based on search query
    const getFilteredTranslations = () => {
        if (!searchQuery.trim()) {
            return signTranslations;
        }

        const query = searchQuery.toLowerCase().trim();
        return signTranslations.filter(item =>
            item.text && item.text.toLowerCase().includes(query)
        );
    };

    const filteredTranslations = getFilteredTranslations();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <Common />

            <View style={styles.header}>
                <Text style={styles.title}>Saved Translations</Text>

                {/* Search bar */}
                <View style={styles.searchContainer}>
                    <AntDesign
                        name="search1"
                        size={moderateScale(20)}
                        color="#999"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search translations..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#155658" />
                    <Text style={styles.loadingText}>Loading saved translations...</Text>
                </View>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {filteredTranslations.length > 0 ? (
                            <>
                                {filteredTranslations.map((item, index) => (
                                    <View key={index} style={styles.translationItem}>
                                        <View style={styles.translationHeader}>
                                            <Text style={styles.translationDate}>
                                                {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => deleteTranslation(index)}
                                            >
                                                <AntDesign name="delete" size={moderateScale(18)} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.translationText}>{item.text}</Text>

                                        {/* Show signs for sign-to-text translations */}
                                        {item.signs && item.signs.length > 0 && (
                                            <View style={styles.signsContainer}>
                                                {item.signs.slice(0, 10).map((sign, signIndex) => (
                                                    <View key={signIndex} style={styles.signBadge}>
                                                        <Text style={styles.signText}>{sign}</Text>
                                                    </View>
                                                ))}
                                                {item.signs.length > 10 && (
                                                    <Text style={styles.moreSignsText}>+{item.signs.length - 10} more</Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}

                                {/* Clear all button */}
                                <TouchableOpacity
                                    style={styles.clearAllButton}
                                    onPress={clearAllTranslations}
                                >
                                    <AntDesign name="delete" size={moderateScale(16)} color="#F44336" />
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={moderateScale(60)} color="#ccc" />
                                <Text style={styles.emptyText}>No saved translations</Text>
                                <Text style={styles.emptySubtext}>
                                    Your sign language translations will appear here
                                </Text>
                            </View>
                        )}

                        {/* Bottom padding */}
                        <View style={styles.bottomPadding} />
                    </ScrollView>

                    {/* Undo toast */}
                    {showUndoToast && (
                        <View style={styles.undoToast}>
                            <Text style={styles.undoToastText}>Translation deleted</Text>
                            <TouchableOpacity onPress={undoDelete}>
                                <Text style={styles.undoButton}>UNDO</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#D0F3DA",
    },
    header: {
        backgroundColor: "#fff",
        paddingTop: verticalScale(60),
        paddingBottom: verticalScale(15),
        paddingHorizontal: scale(20),
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    title: {
        fontSize: fontSize(24),
        fontWeight: "bold",
        color: "#155658",
        marginBottom: verticalScale(15),
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        paddingHorizontal: scale(15),
        borderRadius: moderateScale(10),
        marginBottom: verticalScale(15),
    },
    searchIcon: {
        marginRight: scale(10),
    },
    searchInput: {
        flex: 1,
        height: verticalScale(40),
        fontSize: fontSize(16),
        color: "#333",
    },
    scrollContent: {
        padding: moderateScale(20),
        paddingBottom: verticalScale(100),
    },
    translationItem: {
        backgroundColor: "#fff",
        borderRadius: moderateScale(10),
        padding: moderateScale(15),
        marginBottom: verticalScale(15),
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    translationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: verticalScale(10),
    },
    translationDate: {
        fontSize: fontSize(12),
        color: "#666",
    },
    deleteButton: {
        padding: moderateScale(5),
    },
    translationText: {
        fontSize: fontSize(16),
        color: "#333",
        marginBottom: verticalScale(10),
    },
    signsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: verticalScale(5),
    },
    signBadge: {
        backgroundColor: "#E0F2F1",
        borderRadius: moderateScale(15),
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(5),
        margin: moderateScale(3),
    },
    signText: {
        color: "#155658",
        fontSize: fontSize(12),
        fontWeight: "500",
    },
    moreSignsText: {
        color: "#666",
        fontSize: fontSize(12),
        alignSelf: "center",
        marginLeft: scale(5),
    },
    clearAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: moderateScale(10),
        padding: moderateScale(15),
        marginTop: verticalScale(10),
    },
    clearAllText: {
        color: "#F44336",
        marginLeft: scale(10),
        fontWeight: "500",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: verticalScale(50),
    },
    emptyText: {
        fontSize: fontSize(18),
        fontWeight: "bold",
        color: "#666",
        marginTop: verticalScale(20),
    },
    emptySubtext: {
        fontSize: fontSize(14),
        color: "#999",
        marginTop: verticalScale(10),
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: verticalScale(10),
        color: "#155658",
    },
    undoToast: {
        position: "absolute",
        bottom: verticalScale(20),
        left: scale(20),
        right: scale(20),
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: moderateScale(10),
        padding: moderateScale(15),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    undoToastText: {
        color: "#fff",
    },
    undoButton: {
        color: "#4CAF50",
        fontWeight: "bold",
    },
    bottomPadding: {
        height: verticalScale(100),
    },
}); 