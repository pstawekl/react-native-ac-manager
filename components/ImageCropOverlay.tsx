import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { PanResponderGestureState } from 'react-native/Libraries/Interaction/PanResponder';
import Colors from '../consts/Colors';

type DraggingPart =
  | 'TL'
  | 'TC'
  | 'TR'
  | 'CL'
  | 'CC'
  | 'CR'
  | 'BL'
  | 'BC'
  | 'BR';

export type ImageCropOverlayLayout = {
  width: number;
  height: number;
  top: number;
  left: number;
};

export type ImageCropOverlayProps = {
  minWidth?: number;
  minHeight?: number;
  initialWidth: number;
  initialHeight: number;
  initialTop: number;
  initialLeft: number;
  imageWidth: number;
  imageHeight: number;
  positionTop: number;
  onLayoutChanged: ({
    width,
    height,
    top,
    left,
  }: ImageCropOverlayLayout) => void;
};

function ImageCropOverlay({
  minWidth = 100,
  minHeight = 100,
  initialWidth,
  initialHeight,
  initialTop,
  initialLeft,
  imageWidth,
  imageHeight,
  positionTop,
  onLayoutChanged,
}: ImageCropOverlayProps) {
  const [offset, setOffset] = useState({ left: 0, top: 0 });
  const [draggingType, setDraggingType] = useState<DraggingPart | null>(null);

  const calculateNewLayout = useCallback(
    (offsetTop: number, offsetLeft: number) => {
      const newLayout = {
        top: initialTop,
        left: initialLeft,
        width: initialWidth,
        height: initialHeight,
      };

      // Width
      if (draggingType && ['TL', 'CL', 'BL'].includes(draggingType)) {
        newLayout.width -= offsetLeft;
      } else if (draggingType && !['TC', 'CC', 'BC'].includes(draggingType)) {
        newLayout.width += offsetLeft;
      }
      if (newLayout.width > imageWidth) {
        // We can't go over the initial width
        newLayout.width = imageWidth;
      }
      if (newLayout.width < minWidth) {
        // We can't go under the minimum width
        newLayout.width = minWidth;
      }

      // Height
      if (draggingType && ['TL', 'TC', 'TR'].includes(draggingType)) {
        newLayout.height -= offsetTop;
      } else if (draggingType && !['CL', 'CC', 'CR'].includes(draggingType)) {
        newLayout.height += offsetTop;
      }
      if (newLayout.height > imageHeight) {
        // We can't go over the initial height
        newLayout.height = imageHeight;
      }
      if (newLayout.height < minHeight) {
        // We can't go under the minimum height
        newLayout.height = minHeight;
      }

      // Top
      if (draggingType && ['TL', 'TC', 'TR', 'CC'].includes(draggingType)) {
        if (newLayout.height + offsetTop <= imageHeight) {
          // We can't go over the image height
          newLayout.top += offsetTop;
        } else {
          newLayout.top = imageHeight - newLayout.height;
        }
      }
      if (newLayout.top < 0) {
        newLayout.top = 0;
      }

      // Left
      if (draggingType && ['TL', 'CL', 'BL', 'CC'].includes(draggingType)) {
        if (newLayout.width + offsetLeft <= imageWidth) {
          newLayout.left += offsetLeft;
        } else {
          newLayout.left = imageWidth - newLayout.width;
        }
      }
      if (newLayout.left < 0) {
        newLayout.left = 0;
      }

      return newLayout;
    },
    [
      initialTop,
      initialLeft,
      imageHeight,
      imageWidth,
      initialHeight,
      minHeight,
      initialWidth,
      minWidth,
      draggingType,
    ],
  );

  const style = calculateNewLayout(offset.top, offset.left);

  const getTappedItem = useCallback(
    (x: number, y: number): DraggingPart | null => {
      const xPos = Math.floor(
        (Math.round(x) - Math.round(initialLeft)) / (initialWidth / 3),
      );
      const yPos = Math.floor(
        Math.round(y - Math.ceil(positionTop) - Math.round(initialTop)) /
          Math.round(initialHeight / 3),
      );

      const index = yPos * 3 + xPos;

      switch (index) {
        case 0:
          return 'TL';
        case 1:
          return 'TC';
        case 2:
          return 'TR';
        case 3:
          return 'CL';
        case 4:
          return 'CC';
        case 5:
          return 'CR';
        case 6:
          return 'BL';
        case 7:
          return 'BC';
        case 8:
          return 'BR';
        default:
          return null;
      }
    },
    [initialHeight, initialLeft, initialTop, initialWidth, positionTop],
  );

  // We were granted responder status! Let's update the UI
  const handlePanResponderGrant = useCallback(
    (event: GestureResponderEvent) => {
      const item = getTappedItem(
        event.nativeEvent.pageX,
        event.nativeEvent.pageY,
      );

      if (item !== null) {
        setDraggingType(item);
      }
    },
    [getTappedItem],
  );

  const handlePanResponderMove = (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    setOffset({
      left: gestureState.dx,
      top: gestureState.dy,
    });
  };

  const handlePanResponderEnd = useCallback(
    (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const newLayout = calculateNewLayout(gestureState.dy, gestureState.dx);

      setOffset({
        left: 0,
        top: 0,
      });
      setDraggingType(null);
      onLayoutChanged(newLayout);
    },
    [calculateNewLayout, onLayoutChanged],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: handlePanResponderGrant,
        onPanResponderMove: handlePanResponderMove,
        onPanResponderRelease: handlePanResponderEnd,
        onPanResponderTerminate: handlePanResponderEnd,
      }),
    [handlePanResponderEnd, handlePanResponderGrant],
  );

  return (
    <View
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...panResponder.panHandlers}
      style={[style, styles.container]}
    >
      <View style={styles.flexRow}>
        <View style={styles.flexThird} />
        <View style={styles.flexThird} />
        <View style={styles.flexThird} />
      </View>
      <View style={styles.flexRow}>
        <View style={styles.flexThird} />
        <View style={styles.flexThird} />
        <View style={styles.flexThird} />
      </View>
      <View style={styles.overlay}>
        <View style={styles.flexThirdRow}>
          <View
            style={[styles.border, styles.borderRight, styles.borderBottom]}
          >
            <View style={[styles.absolute, styles.leftTop]} />
          </View>
          <View
            style={[styles.border, styles.borderRight, styles.borderBottom]}
          />
          <View style={[styles.border, styles.borderBottom]}>
            <View style={[styles.absolute, styles.rightTop]} />
          </View>
        </View>
        <View style={styles.flexThirdRow}>
          <View
            style={[styles.border, styles.borderRight, styles.borderBottom]}
          />
          <View
            style={[styles.border, styles.borderRight, styles.borderBottom]}
          />
          <View style={[styles.border, styles.borderBottom]} />
        </View>
        <View style={styles.flexThirdRow}>
          <View style={[styles.border, styles.borderRight, styles.relative]}>
            <View style={[styles.absolute, styles.leftBottom]} />
          </View>
          <View style={[styles.border, styles.borderRight]} />
          <View style={[styles.flex3, styles.relative]}>
            <View style={[styles.absolute, styles.rightBottom]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderStyle: 'solid',
    borderWidth: 2,
    backgroundColor: Colors.cardShadow,
  },
  flexRow: {
    flexDirection: 'row',
    width: '100%',
    flex: 1 / 3,
    backgroundColor: Colors.transparent,
  },
  flexThird: {
    borderWidth: 0,
    flex: 1 / 3,
    height: '100%',
  },
  flexThirdRow: {
    flex: 1 / 3,
    flexDirection: 'row',
  },
  border: {
    flex: 3,
    borderColor: Colors.cropBorder,
    borderStyle: 'solid',
  },
  borderRight: {
    borderRightWidth: 1,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  relative: {
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
    height: 48,
    width: 48,
    borderColor: Colors.invoiceFormTextContainer,
    borderStyle: 'solid',
  },
  flex3: {
    flex: 3,
  },
  overlay: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: Colors.cropOverlay,
  },
  leftTop: {
    left: 5,
    top: 5,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  rightTop: {
    right: 5,
    top: 5,
    borderRightWidth: 2,
    borderTopWidth: 2,
  },
  leftBottom: {
    left: 5,
    bottom: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
  },
  rightBottom: {
    right: 5,
    bottom: 5,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
});

export default ImageCropOverlay;
