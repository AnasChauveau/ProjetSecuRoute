import React, { useState, useEffect, useMemo, useCallback } from "react";
import MapView from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import { Circle } from "react-native-maps"; // Import du composant Circle
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Définir un type pour les radars
interface Radar {
  __id: number;
  latitude: number;
  longitude: number;
  emplacement: string;
  direction: string;
  type: string;
  vitesse_vehicules_legers_kmh?: number;
  route?: string;
}

const INITIAL_REGION = {
  latitude: 46.603354,
  longitude: 1.888334,
  latitudeDelta: 20,
  longitudeDelta: 20, 
};

const Map: React.FC = () => {
  const [radars, setRadars] = useState<Radar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [region, setRegion] = useState(INITIAL_REGION); // État pour la région visible

  const fetchRadars = useCallback(async () => {
    let allRadars: Radar[] = [];
    const pageSize = 50;

    try {
      const response = await fetch(
        `https://tabular-api.data.gouv.fr/api/resources/8a22b5a8-4b65-41be-891a-7c0aead4ba51/data/?page=1&page_size=${pageSize}`
      );
      const firstPageData = await response.json();

      const totalRadars = firstPageData.meta.total;
      const totalPages = Math.ceil(totalRadars / pageSize);

      const requests = [];
      for (let i = 2; i <= totalPages; i++) {
        requests.push(
          `https://tabular-api.data.gouv.fr/api/resources/8a22b5a8-4b65-41be-891a-7c0aead4ba51/data/?page=${i}&page_size=${pageSize}`
        );
      }

      const allPartsResponses = await Promise.all(requests.map((r) => fetch(r)));
      const allPartsSeparated = await Promise.all(allPartsResponses.map((res) => res.json()));
      const allParts = allPartsSeparated.flatMap((p) => p.data);

      setRadars(allParts);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des radars:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRadars();
  }, []);

  const radarCircles = useMemo(() => {
    const radarsFilter = radars.filter((radar) => {
      const withinLatitude =
        radar.latitude >= region.latitude - region.latitudeDelta / 2 &&
        radar.latitude <= region.latitude + region.latitudeDelta / 2;
      const withinLongitude =
        radar.longitude >= region.longitude - region.longitudeDelta / 2 &&
        radar.longitude <= region.longitude + region.longitudeDelta / 2;
      return withinLatitude && withinLongitude;
    });
  
    return radarsFilter.map((radar) => (
      <Circle
        key={radar.__id}
        center={{
          latitude: radar.latitude,
          longitude: radar.longitude,
        }}
        radius={500}
        strokeWidth={1}
        strokeColor="rgba(255, 0, 0, 0.5)"
        fillColor="rgba(255, 0, 0, 0.3)"
      />
    ));
  }, [radars, region]);
  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewClustering 
      initialRegion={INITIAL_REGION} 
      style={styles.map}
      onRegionChangeComplete={r => setRegion(r)}>
        {radarCircles}
      </MapViewClustering>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default Map;
