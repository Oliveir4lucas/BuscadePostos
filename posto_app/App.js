import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const App = () => {
  const [healthFacilities, setHealthFacilities] = useState(null);
  const [location, setLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de localização não concedida',
          'Por favor, conceda permissão de localização para obter a localização.'
        );
        return;
      }
      Location.watchPositionAsync({ accuracy: Location.Accuracy.High }, handleLocationUpdate);
    })();
  }, []);

  const handleLocationUpdate = (location) => {
    setLocation(location);
  };

  useEffect(() => {
    // Fetch health facilities data
    const fetchHealthFacilities = async () => {
      try {
        const response = await fetch('http://dados.recife.pe.gov.br/dataset/08a65119-e0a1-4e70-9276-b975034980a0/resource/b309d41b-6eb2-4bdd-af6e-581be5f8e239/download/saudemunicipalestadual.geojson');
        const data = await response.json();
        setHealthFacilities(data);
      } catch (error) {
        console.error(error);
        Alert.alert(
          'Erro',
          'Houve um problema ao obter os dados da rede de saúde. Tente novamente mais tarde.'
        );
      }
    };

    fetchHealthFacilities();
  }, []);

  useEffect(() => {
    // Update markers when search results change
    const newMarkers = searchResults.map((facility, index) => ({
      id: index,
      title: facility.properties.NMUNIDAD,
      coordinate: {
        latitude: facility.geometry.coordinates[0][0][1],
        longitude: facility.geometry.coordinates[0][0][0],
      },
    }));
    setMarkers(newMarkers);
  }, [searchResults]);

  const handleSearch = () => {
    const results = healthFacilities.features.filter(facility => 
      facility.properties.NMENDUNID.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>
          Rede de Saúde Municipal do Recife
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o nome do bairro"
          value={searchTerm}
          onChangeText={text => setSearchTerm(text)}
        />
        <Button title="Pesquisar" onPress={handleSearch} />
        {location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationHeader}>Sua Localização</Text>
            <Text>Latitude: {location.coords.latitude}</Text>
            <Text>Longitude: {location.coords.longitude}</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {markers.map(marker => (
                <Marker
                  key={marker.id}
                  coordinate={marker.coordinate}
                  title={marker.title}
                />
              ))}
            </MapView>
          </View>
        )}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Unidades de Saúde no Bairro</Text>
          {searchResults.map((facility, index) => (
            <View key={index} style={styles.facilityContainer}>
              <Text>Nome: {facility.properties.NMUNIDAD}</Text>
              <Text>Endereço: {facility.properties.NMENDUNID}</Text>
              <Text>Tipo de Patrimônio: {facility.properties.NMPATRIM}</Text>
              <Text>Tipo: {facility.properties.CDTIPO}</Text>
              <View style={styles.separator} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    marginVertical: 10,
    padding: 8,
  },
  locationContainer: {
    marginVertical: 20,
  },
  locationHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 200,
  },
  resultsContainer: {
    marginVertical: 20,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  facilityContainer: {
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
});

export default App;
