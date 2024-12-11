import React, { useState, useEffect, useMemo, useCallback } from "react";
import MapView from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import { Circle } from "react-native-maps"; // Import du composant Circle
import * as Location from "expo-location"; // Importer expo-location
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";

// Fonction pour calculer la distance entre deux points en utilisant la formule de Haversine
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Retourne la distance en mètres
}

// Fonction pour vérifier si l'utilisateur est à l'intérieur de la zone d'un radar (500m)
function getRadarInside(lat: number, lon: number, radars: Radar[]): Radar | null {
  for (const radar of radars) {
    const distance = haversineDistance(lat, lon, radar.latitude, radar.longitude);
    if (distance <= 500) {
      return radar; // Retourne le radar dans lequel l'utilisateur est
    }
  }
  return null; // L'utilisateur n'est pas dans la zone d'un radar
}

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

const Map: React.FC = () => {
  const [inRadar, setInRadar] = useState<Radar | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [radars, setRadars] = useState<Radar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [region, setRegion] = useState({
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Fonction pour récupérer la localisation de l'utilisateur
  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Suivre la position en temps réel
      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High, // Haute précision
          timeInterval: 1000, // Temps minimum entre deux mises à jour (en millisecondes)
          distanceInterval: 1, // Distance minimum entre deux mises à jour (en mètres)
        },
        (newLocation) => {
          if(startTime == 0){
            console.log(`pas encore de start Time`);
            let radar = getRadarInside(newLocation?.coords.latitude!, newLocation?.coords.longitude!, radarsFilter);
            if(radar != null){
              setStartTime(Date.now);
              setInRadar(getRadarInside(newLocation?.coords.latitude!, newLocation?.coords.longitude!, radarsFilter));
              console.log(`new start Time`);
            }else{
              console.log(`Rien`);
            }
          }else{
            console.log(`ya un start Time : ${startTime}`);
            if(inRadar != null){
              console.log(`ya un radar : ${inRadar}`);
              let autreRadar = getRadarInside(newLocation?.coords.latitude!, newLocation?.coords.longitude!, radarsFilter);
              if(autreRadar != inRadar){
                let secondes = Date.now() - startTime;
                console.log(`Nouveau Score : Vous avez traversé le radar numéro ${inRadar.__id} en ${secondes} secondes !`);
                Alert.alert('Nouveau Score', `Vous avez traversé le radar numéro ${inRadar.__id} en ${secondes} secondes !`, [
                    {
                      text: 'Cancel',
                      onPress: () => console.log('Cancel Pressed'),
                      style: 'cancel',
                    },
                    {text: 'OK', onPress: () => console.log('OK Pressed')},
                ]);
                setStartTime(0);
                setInRadar(null);
              }else{
                console.log(`radar entrer : ${inRadar} et sortie : ${autreRadar}`);
              }
            }else{
              console.log(`Rien 2`);
            }
          }
          setLocation(newLocation);
        }
      );
    })();
    return () => {
      if (subscriber) {
        subscriber.remove(); // Arrêter le tracking si le composant est démonté
      }
    };
  }, []);

  // Fonction pour récupérer la localisation de l'utilisateur
  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let firstLocation = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: firstLocation.coords.latitude,
        longitude: firstLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      })
      setLoading(true);
    })()
  }, []);

  // Appel de la fonction de localisation au démarrage du composant
  useEffect(() => {
    fetchRadars(); // Charger les radars
  }, []);

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

  const radarsFilter = useMemo(() => radars.filter((radar) => {
    const withinLatitude =
      radar.latitude >= region.latitude - region.latitudeDelta / 2 &&
      radar.latitude <= region.latitude + region.latitudeDelta / 2;
    const withinLongitude =
      radar.longitude >= region.longitude - region.longitudeDelta / 2 &&
      radar.longitude <= region.longitude + region.longitudeDelta / 2;
    return withinLatitude && withinLongitude;
  }), [radars, region])

  const radarCircles = useMemo(() => {
    const myCercle = (
      <Circle
        key="myCercle"
        center={{
          latitude: location?.coords.latitude || region.latitude,
          longitude: location?.coords.longitude || region.longitude,
        }}
        radius={1}
        strokeWidth={10}
        strokeColor="rgba(0, 0, 255, 0.5)"
        fillColor="rgba(0, 0, 255, 0.3)"
      />
    );

    const myRadar = (
      <Circle
        key="myRadar"
        center={{
          latitude: 45.18165, 
          longitude: 5.756056
        }}
        radius={500}
        strokeWidth={1}
        strokeColor="rgba(255, 0, 255, 0.5)"
        fillColor="rgba(255, 0, 255, 0.3)"
      />
    );

    return (
      <>
        {myCercle}
        {myRadar}
        {radarsFilter.map((radar) => (
          <Circle
            key={radar.__id}
            style={styles.myCircle}
            center={{
              latitude: radar.latitude,
              longitude: radar.longitude,
            }}
            radius={500}
            strokeWidth={1}
            strokeColor="rgba(255, 0, 0, 0.5)"
            fillColor="rgba(255, 0, 0, 0.3)"
          />
        ))}
      </>
    );
  }, [radars, region, radarsFilter, location]);


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
        initialRegion={region}
        region={region}
        style={styles.map}
        onRegionChangeComplete={r => {
          if(Math.abs(r.latitude - region.latitude) > 0.001 && Math.abs(r.longitude - region.latitude) > 0.001){
            setRegion(r)
          }
        }}>
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
  myCircle: {
    zIndex: 1000
  }
});

export default Map;