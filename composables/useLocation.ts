import { useGeolocation } from "@vueuse/core";

interface GeolocationData {
  rua?: string;
  cidade?: string;
  estado?: string;
  numero?: number;
  cep?: string;
}

/*
Função para obter a localização do usuário via GPS/Wi-Fi com validação para Fake GPS
Validações FakeGPS:
- Valida a localização do usuário comparando com a localização aproximada via IP, usando a fórmula de Haversine para medir a distância entre pontos geográficos
- Considera suspeita qualquer diferença maior que 250 km entre as coordenadas atuais e: A última coordenada salva / A localização obtida via IP
*/
export const useLocation = () => {
  const { coords, isSupported, error } = useGeolocation({
    enableHighAccuracy: true,
  });

  const lastLocation = ref<{ lat: number; lng: number } | null>(null);
  const isLoadingGeolocation = ref<boolean>(false);
  const setIsLoadingGeolocation = (value: boolean) => (isLoadingGeolocation.value = value);

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchGeolocationData = async (
    latitude: number,
    longitude: number
  ): Promise<GeolocationData> => {
    setIsLoadingGeolocation(true);

    try {
      const data = await useApi<GeolocationData>("/api/map", {
        method: "POST",
        body: { latitude, longitude },
      });

      return data;
    } catch (err) {
      console.error(err);
      throw new Error("Erro ao processar os dados de localização");
    } finally {
      setIsLoadingGeolocation(false);
    }
  };

  const getIpLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    try {
      const res: any = await $fetch("https://ipwhois.app/json/");
      return { latitude: res.latitude, longitude: res.longitude };
    } catch (err) {
      throw new Error("Erro ao validar localização pelo IP");
    }
  };

  const detectFakeGPS = async (latitude: number, longitude: number): Promise<boolean> => {
    if (lastLocation.value) {
      const distance = haversineDistance(
        lastLocation.value.lat,
        lastLocation.value.lng,
        latitude,
        longitude
      );

      if (distance > 250) return true;
    }

    const ipLocation = await getIpLocation();
    const distanceFromIP = haversineDistance(
      latitude,
      longitude,
      ipLocation.latitude,
      ipLocation.longitude
    );

    if (distanceFromIP > 250) return true;
    lastLocation.value = { lat: latitude, lng: longitude };
    return false;
  };

  const getGeolocation = async (): Promise<GeolocationData> => {
    if (!isSupported.value) throw new Error("Geolocalização não está disponível");
    if (error.value) throw new Error("Erro ao obter geolocalização: " + error.value.message);

    const { latitude, longitude } = coords.value;
    if (latitude === null || longitude === null) throw new Error("Erro ao obter as coordenadas");

    const isFake = await detectFakeGPS(latitude, longitude);
    if (isFake) throw new Error("Localização suspeita detectada!");

    return fetchGeolocationData(latitude, longitude);
  };

  const getCoords = async (): Promise<{ latitude: number; longitude: number }> => {
    if (!isSupported.value) throw new Error("Geolocalização não está disponível");
    if (error.value) throw new Error("Erro ao obter geolocalização: " + error.value.message);

    const { latitude, longitude } = coords.value;
    if (latitude === null || longitude === null) throw new Error("Erro ao obter as coordenadas");

    const isFake = await detectFakeGPS(latitude, longitude);
    if (isFake) throw new Error("Localização suspeita detectada!");

    return { latitude, longitude };
  };

  return { getGeolocation, getCoords, isLoadingGeolocation };
};
