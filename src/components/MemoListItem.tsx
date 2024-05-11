import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
export type Memo = {
    uri: string;
    metering: number[];
    durationMillis?: number; // 添加可选的 durationMillis 属性
};

/*
这是一个名为 MemoListItem 的 React Native 组件。它用于在列表中显示单个备忘录项。每个备忘录项都与一个音频文件相关联。

以下是代码的详细解释：

Memo 类型定义了 uri（音频文件的位置）、metering（表示音频级别的数字数组）和 durationMillis（音频文件的持续时间，以毫秒为单位）的属性。

MemoListItem 组件接受一个 memo 对象作为 prop。

useState 钩子用于管理声音、播放状态和持续时间的状态。

loadSound 函数用于从 memo 对象提供的 uri 加载声音。

onPlaybackStatusUpdate 函数是一个回调，用于更新播放状态。如果声音已经播放完毕，它会将位置重置到开始。

useEffect 钩子用于在组件挂载时加载声音，并在组件卸载时卸载声音。

playSound 函数根据声音的当前状态来播放或暂停声音。

formatMillis 函数用于将声音的位置和持续时间从毫秒格式化。

isPlaying、position、duration 和 progress 是根据播放状态计算的变量。

animatedIndicatorStyle 是一个动画样式，它的左边距是根据播放进度计算的。

numLines 和 lines 用于计算音频的平均级别，并将其存储在 lines 数组中。

最后，组件返回一个包含播放/暂停按钮、文件位置、波形和播放指示器的视图。
*/
const MemoListItem = ({ memo }: { memo: Memo }) => {
    const [sound, setSound] = useState<Sound>();
    const [status, setStatus] = useState<AVPlaybackStatus>();
    const [durationMillis, setDurationMillis] = useState<number | undefined>(
        memo.durationMillis,
    );
    const [expanded, setExpanded] = useState(false); // 展开当前memo
    const [text, setText] = useState("当前是硬编码的文字QAQ"); // 用于展示转换后的文本

    // 展开/收起当前memo
    const toggleExpanded = () => {
        setExpanded(!expanded);
    }

    async function loadSound() {
        const { sound } = await Audio.Sound.createAsync(
            { uri: memo.uri },
            { progressUpdateIntervalMillis: 1000 / 60 },
            onPlaybackStatusUpdate,
        );
        setSound(sound);
        setDurationMillis(memo.durationMillis); // 立即设置 durationMillis
    }

    const onPlaybackStatusUpdate = useCallback(
        async (newStatus: AVPlaybackStatus) => {
            setStatus(newStatus);

            if (!newStatus.isLoaded || !sound) {
                return;
            }

            if (newStatus.didJustFinish) {
                await sound?.setPositionAsync(0);
            }
        },
        [sound],
    );

    useEffect(() => {
        loadSound();
    }, [memo]);

    async function playSound() {
        if (!sound) {
            return;
        }
        if (status?.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.replayAsync();
        }
    }

    useEffect(() => {
        return sound
            ? () => {
                  console.log("Unloading Sound");
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const formatMillis = (millis: number) => {
        const minutes = Math.floor(millis / (1000 * 60));
        const seconds = Math.floor((millis % (1000 * 60)) / 1000);

        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const isPlaying = status?.isLoaded ? status.isPlaying : false;
    const position = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis : 1;

    const progress = position / duration;

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        left: `${progress * 100}%`,
        // withTiming(`${progress * 100}%`, {
        //   duration:
        //     (status?.isLoaded && status.progressUpdateIntervalMillis) || 100,
        // }),
    }));

    let numLines = 50;
    let lines = [];

    for (let i = 0; i < numLines; i++) {
        const meteringIndex = Math.floor((i * memo.metering.length) / numLines);
        const nextMeteringIndex = Math.ceil(
            ((i + 1) * memo.metering.length) / numLines,
        );
        const values = memo.metering.slice(meteringIndex, nextMeteringIndex);
        const average = values.reduce((sum, a) => sum + a, 0) / values.length;
        // lines.push(memo.metering[meteringIndex]);
        lines.push(average);
    }
    
    return (
        <LinearGradient
        colors={['#E6F7FF','#FFFFFF']}
        start={{x: 0,y:0}}
        end={{x:1, y:0}}
        style={{ borderRadius: 2, padding: 2 }}>
        <TouchableOpacity
        style={[styles.container, expanded && styles.expandedContainer]}
        onPress={toggleExpanded}
    >
        <View style={styles.header}>
            <View style={styles.playbackRow}>
                <FontAwesome5
                    onPress={playSound}
                    name={isPlaying ? "pause" : "play"}
                    size={20}
                    color={"gray"}
                />
                <View style={styles.wave}>
                    {lines.map((db, index) => (
                        <View
                            key={index}
                            style={[
                                styles.waveLine,
                                {
                                    height: interpolate(
                                        db,
                                        [-60, 0],
                                        [5, 30],
                                        Extrapolate.CLAMP,
                                    ),
                                    backgroundColor:
                                        progress > index / lines.length
                                            ? "royalblue"
                                            : "gainsboro",
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>
            <Text style={styles.duration}>
                {formatMillis(position || 0)} / {formatMillis(duration || 0)}
            </Text>
        </View>
        {expanded && (
            <View style={styles.expandedContent}>
                <LinearGradient
                    colors={['#E6F7FF','#FFFFFF']}
                    start={{x: 0,y:0}}
                    end={{x:1, y:0}}
                    style={{ borderRadius: 2, padding: 2 }}>
                <TextInput
                    style={[styles.textInput, { height: 'auto', minHeight: 0 }]}
                    multiline
                    value={text}
                    onChangeText={setText}
                />
                </LinearGradient>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>上传</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>暂存</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
    </TouchableOpacity>
    </LinearGradient>
    
    );
    };
    
    const styles = StyleSheet.create({
        container: {
            backgroundColor: "white",
            margin: 5,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 3,
        },
        expandedContainer: {
            paddingBottom: 20,
        },
        header: {
            marginBottom: 10,
        },
        playbackRow: {
            flexDirection: "row",
            alignItems: "center",
        },
        wave: {
            flexDirection: "row",
            alignItems: "center",
            height: 30,
            flex: 1,
            marginLeft: 10,
        },
        waveLine: {
            flex: 1,
            height: 30,
            backgroundColor: "gainsboro",
            borderRadius: 20,
            marginRight: 3,
        },
        duration: {
            alignSelf: "flex-end",
            marginTop: 5,
            color: "gray",
            fontSize: 12,
        },
        expandedContent: {
            marginTop: 10,
        },
        // 设计1：使用柔和的淡蓝色边框，带有阴影效果
        // textInput: {
        //     borderWidth: 1,
        //     borderColor: "#e0e0e0",
        //     borderRadius: 5,
        //     padding: 10,
        //     marginBottom: 10,
        //     shadowColor: "#000",
        //     shadowOffset: {
        //         width: 0,
        //         height: 1,
        //     },
        //     shadowOpacity: 0.1,
        //     shadowRadius: 2,
        //     elevation: 2,
        // },

        // 设计2：使用渐变色边框，带有内边距
        textInput: {
            borderWidth: 2,
            borderRadius: 5,
            padding: 10,
            marginBottom: 0,
        },

        // // 设计3：使用虚线边框，带有占位符文字
        // textInput: {
        //     borderWidth: 1,
        //     borderColor: "#ccc",
        //     borderStyle: "dashed",
        //     borderRadius: 5,
        //     padding: 10,
        //     marginBottom: 10,
        //     placeholderTextColor: "#999",
        //     placeholder: "请输入文字...",
        // },
        
        buttonContainer: {
            flexDirection: "row",
            justifyContent: "space-around",
        },
        button: {
            marginTop:10,
            backgroundColor: "royalblue",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
        },
        buttonText: {
            color: "white",
            fontWeight: "bold",
        },
    });

export default MemoListItem;
