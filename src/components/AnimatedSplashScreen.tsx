// components/AnimatedSplashScreen.tsx
import { View } from "react-native";
import LottieView from "lottie-react-native";
import { useRef } from "react";
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    ZoomOut,
} from "react-native-reanimated";

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const AnimatedSplashScreen = ({
    onAnimationFinish = (isCancelled) => {},
}: {
    onAnimationFinish?: (isCancelled: boolean) => void;
}) => {
    const animation = useRef<LottieView>(null);

    return (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "black",
            }}
        >
            <AnimatedLottieView
                exiting={ZoomOut}
                ref={animation}
                onAnimationFinish={() => {
                    console.log("Animation Finished");
                    onAnimationFinish(false);
                }} // 通知动画完成
                loop={false}
                autoPlay
                style={{
                    width: "80%",
                    maxWidth: 400,
                }}
                source={require("@assets/lottie/netflix.json")}
            />
        </View>
    );
};

export default AnimatedSplashScreen;
