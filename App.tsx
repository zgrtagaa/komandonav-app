import { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';

export default function App() {
  const webRef = useRef<WebView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const callbackIdRef = useRef(1);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const asset = Asset.fromModule(require('./assets/app.html'));
      await asset.downloadAsync();
      setUri(asset.localUri!);

      if (status !== 'granted') return;

      // iOS WKWebView blocks geolocation for file:// URIs — bridge via native
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (loc) => {
          const { latitude, longitude, altitude, accuracy, heading, speed } = loc.coords;
          const ts = loc.timestamp;
          const id = callbackIdRef.current;
          const js = `
            (function(){
              var pos={
                coords:{
                  latitude:${latitude},longitude:${longitude},
                  altitude:${altitude ?? 0},accuracy:${accuracy ?? 10},
                  altitudeAccuracy:null,heading:${heading ?? null},speed:${speed ?? null}
                },
                timestamp:${ts}
              };
              if(window.__nativeGeoSuccess){window.__nativeGeoSuccess(pos);}
              if(window.__nativeGeoWatchCbs){
                Object.values(window.__nativeGeoWatchCbs).forEach(function(cb){cb(pos);});
              }
            })();
          `;
          webRef.current?.injectJavaScript(js);
        }
      );
    })();

    return () => { watchRef.current?.remove(); };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#14161a" />
      {uri && (
        <WebView
          ref={webRef}
          source={{ uri }}
          style={styles.web}
          geolocationEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          originWhitelist={['*']}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          allowFileAccess={true}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          onError={(e) => console.log('WebView error:', e.nativeEvent)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#14161a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  web: {
    flex: 1,
    backgroundColor: '#14161a',
  },
});
