import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import MapView from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import { Marker, Callout } from "react-native-maps";
import { Text, StyleSheet, View, Button, ActivityIndicator } from "react-native";

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
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};

const Map: React.FC = () => {
  const [radars, setRadars] = useState<Radar[]>([]); // Utilisation du type Radar pour le state
  const [loading, setLoading] = useState<boolean>(true); // État pour indiquer le chargement

  // Optimisation de la fonction fetchRadars avec useCallback
  const fetchRadars = useCallback(async () => {
    let allRadars: Radar[] = [];
    const pageSize = 50; // L'API retourne 50 éléments par page

    try {
      // Récupérer les informations sur le total d'éléments
      const response = await fetch(
        `https://tabular-api.data.gouv.fr/api/resources/8a22b5a8-4b65-41be-891a-7c0aead4ba51/data/?page=1&page_size=${pageSize}`
      );
      const firstPageData = await response.json();

      const totalRadars = firstPageData.meta.total; // Total de radars disponibles
      const totalPages = Math.ceil(totalRadars / pageSize); // Nombre total de pages à récupérer

      // Récupère les radars des pages suivantes
      const requests = []

      for (let i = 2; i <= totalPages; i++) {
        requests.push(
          `https://tabular-api.data.gouv.fr/api/resources/8a22b5a8-4b65-41be-891a-7c0aead4ba51/data/?page=${i}&page_size=${pageSize}`
        );
      }
      const allPartsResponses = await Promise.all(
        requests.map(r => fetch(r))
      )
      const allPartsSeparated = await Promise.all(allPartsResponses.map(res => res.json()))
      const allParts = allPartsSeparated.flatMap((p, i) => p.data)

      // Mettez à jour le state avec tous les radars récupérés3

      console.log("radars data", JSON.stringify(allParts, null, 2), allParts.length);
      
      setRadars(allParts);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des radars:", error);
      setLoading(false); // Arrête le chargement en cas d'erreur
    }
  }, []); // La fonction est mémorisée et ne sera pas recréée à chaque rendu

  // Récupérer les radars au démarrage du composant
  useEffect(() => {
    fetchRadars();
  }, []); // Utilise fetchRadars de useCallback dans useEffect

  // Utilisation de useMemo pour éviter les re-rendus inutiles de la liste des radars
  const radarMarkers = useMemo(() => {
    return radars.map((radar) => (
      <Marker
        key={radar.__id}
        coordinate={{
          latitude: radar.latitude,
          longitude: radar.longitude,
        }}
      >
      </Marker>
    ));
  }, [radars]); // La liste des markers ne sera recalculée que si radars change

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MapViewClustering avec la référence mapRef */}
      <MapViewClustering 
        initialRegion={INITIAL_REGION} 
        style={styles.map}
      >
        {radarMarkers}
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
