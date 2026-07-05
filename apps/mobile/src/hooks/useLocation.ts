import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useCurrentLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null, longitude: null, error: null, loading: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) setState((s) => ({ ...s, error: "Joylashuvga ruxsat berilmagan", loading: false }));
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (mounted) {
          setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            error: null,
            loading: false,
          });
        }
      } catch (err: any) {
        if (mounted) {
          setState((s) => ({ ...s, error: err.message || "Joylashuv olinmadi", loading: false }));
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  return state;
}
