import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { AVPlaybackStatus, Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

const MemoListItem = ({ uri }: { uri: string }) => {
    return (
        <View style={styles.container}>
            <FontAwesome5 name={"play"} size={20} color={"grey"} />
            <View style={styles.playbackContainer}>
                <View style={styles.playbackBackground}></View>
            </View>
            <Text>Playback</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        margin: 5,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 15,

        // shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
    },
    playbackContainer: {
        flex: 1, // take up all the remaining space
        height: 30,
        justifyContent: "center",
    },
    playbackBackground: {
        height: 3,
        backgroundColor: "gainsboro",
    },
});

export default MemoListItem;
