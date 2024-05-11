// pages/memos.tsx

import { useEffect, useState } from "react";
import {
    Text,
    View,
    StyleSheet,
    Button,
    FlatList,
    Pressable,
} from "react-native";
import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import MemoListItem, { Memo } from "@/components/MemoListItem";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";

export default function MemosScreen() {


    
    const [recording, setRecording] = useState<Recording>();
    const [memos, setMemos] = useState<Memo[]>([]);

    const [audioMetering, setAudioMetering] = useState<number[]>([]);
    const metering = useSharedValue(-100);

    async function startRecording() {
        try {
            setAudioMetering([]); 

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                undefined,
                100,
            );
            setRecording(recording);

            recording.setOnRecordingStatusUpdate((status) => {
                if (status.metering) {
                    metering.value = status.metering;
                    setAudioMetering((curVal) => [
                        ...curVal,
                        status.metering || -100,
                    ]);
                }
            });
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }

    async function logDirectoryContents(directory: string) {
        try {
            // 确保目录存在，如果不存在，则创建
            const dirInfo = await FileSystem.getInfoAsync(directory);
            if (!dirInfo.exists) {
                // console.log(`Directory ${directory} does not exist, creating...`);
                await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }
    
            // 读取目录内容
            const files = await FileSystem.readDirectoryAsync(directory);
            // console.log(`Files in ${directory}:`, files);
    
            // 如果你还想获取每个文件的更详细信息，可以遍历files数组
            for (const fileName of files) {
                const fileInfo = await FileSystem.getInfoAsync(directory + fileName);
                // console.log(`File Info - ${fileName}:`, fileInfo);
            }
        } catch (error) {
            console.error("Failed to read directory contents:", error);
        }
    }
    

    
    async function stopRecording() {
        if (!recording) {
            return;
        }

        console.log("Stopping recording..");
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI(); // 获取录音文件的URI
        console.log("Recording stopped and stored at", uri);
        metering.value = -100;

        if (uri) {
            const directory = `${FileSystem.documentDirectory}memos/`;
            await FileSystem.makeDirectoryAsync(directory, {
                intermediates: true,
            });
            const newUri = `${directory}${Date.now()}.m4a`;
            await FileSystem.moveAsync({
                from: uri,
                to: newUri,
            });
            console.log("File moved to", newUri);

            // 更新状态以刷新列表
            setMemos((existingMemos) => [
                { uri: newUri, metering: audioMetering },
                ...existingMemos,
            ]);

            // 读取目录内容
            logDirectoryContents(directory);

        }
    }

    // async function stopRecording() {
    //     if (!recording) {
    //         return;
    //     }

    //     console.log("Stopping recording..");
    //     setRecording(undefined);
    //     await recording.stopAndUnloadAsync();
    //     await Audio.setAudioModeAsync({
    //         allowsRecordingIOS: false,
    //     });
    //     const uri = recording.getURI();
    //     console.log("Recording stopped and stored at", uri);
    //     metering.value = -100;
    //     if (uri) {
    //         const { sound } = await Audio.Sound.createAsync({ uri });
    //         setMemos((existingMemos) => [
    //             { uri, metering: audioMetering },
    //             ...existingMemos,
    //         ]);
    //     }
    // }


    const animatedRedCircle = useAnimatedStyle(() => ({
        width: withTiming(recording ? "60%" : "100%"),
        borderRadius: withTiming(recording ? 5 : 35),
    }));

    const animatedRecordWave = useAnimatedStyle(() => {
        const size = withTiming(
            interpolate(metering.value, [-160, -60, 0], [0, 0, -30]),
            { duration: 100 },
        );
        return {
            top: size,
            bottom: size,
            left: size,
            right: size,
            backgroundColor: `rgba(255, 45, 0, ${interpolate(
                metering.value,
                [-160, -60, -10],
                [0.7, 0.3, 0.7],
            )})`,
        };
    });

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <FlatList
                    data={memos}
                    renderItem={({ item }) => <MemoListItem memo={item} />}
                />
            </View>
            <View style={styles.footer}>
                <View>
                    <Animated.View
                        style={[styles.recordWave, animatedRecordWave]}
                    />
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#ecf0f1",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        height: 200,
        alignItems: "center",
        justifyContent: "center",
    },
    recordButton: {
        width: 70,
        height: 70,
        borderRadius: 35,

        borderWidth: 3,
        borderColor: "gray",
        padding: 3,

        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
    },
    recordWave: {
        position: "absolute",
        top: -20,
        bottom: -20,
        left: -20,
        right: -20,
        borderRadius: 1000,
    },

    redCircle: {
        backgroundColor: "orangered",
        aspectRatio: 1,
    },
});
