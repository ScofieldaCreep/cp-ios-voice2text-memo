import { useState } from "react";
import { View, StyleSheet, Button, Text, Pressable } from "react-native";
import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import { FlatList } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import MemoListItem from "@/components/day7/MemoListItem";

export default function MemosScreen() {
    const [recording, setRecording] = useState<Recording>();
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [memos, setMemos] = useState<string[]>([]);

    async function startRecording() {
        try {
            if (permissionResponse.status !== "granted") {
                console.log("Requesting permission..");
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log("Starting recording..");
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            console.log("Recording started");
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }

    async function stopRecording() {
        console.log("Stopping recording..");
        setRecording(undefined);
        if (!recording) {
            return;
        }
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        const uri = recording.getURI();
        console.log("Recording stopped and stored at", uri);
        if (uri) {
            setMemos((existingMemos) => [...existingMemos, uri]);
        }
    }

    const animatedRedCircle = useAnimatedStyle(() => ({
        width: withSpring(recording ? "60%" : "100%"),
        borderRadius: withTiming(recording ? 5 : 35),
    }));

    return (
        <View style={styles.container}>
            <FlatList
                data={memos}
                renderItem={({ item }) => <MemoListItem uri={item} />}
            />
            <View style={styles.footer}>
                <Pressable
                    style={styles.recordButton}
                    onPress={recording ? stopRecording : startRecording}
                >
                    <Animated.View
                        style={[styles.redCircle, animatedRedCircle]}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#ecf0f1",
        padding: 10,
    },
    footer: {
        backgroundColor: "white",
        height: 150,
        alignItems: "center",
        justifyContent: "center",
    },
    recordButton: {
        // alignSelf: 'center',
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "gray",
        padding: 3,
        alignItems: "center",
        justifyContent: "center",
        // alignItems: "center",
    },

    redCircle: {
        backgroundColor: "orangered",
        aspectRatio: 1,
        borderRadius: 30,
    },
});
