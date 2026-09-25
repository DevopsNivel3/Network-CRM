import type { UnwrapNestedRefs } from "vue";

type LeadForm = UnwrapNestedRefs<FormLeadCreate>;

export function useLeadLocationForm(
  formData: LeadForm,
  map: ReturnType<typeof useMap>,
  getGeolocation: ReturnType<typeof useLocation>["getGeolocation"],
) {
  const citiesByState = ref<Record<number, any[]>>({});

  const resetCities = (key: number, location: FormLeadCreateLocation) => {
    citiesByState.value[key] = [];
    location.cidade = "";
  };

  const updateCities = (
    key: number,
    location: FormLeadCreateLocation,
    cities: any[] | null,
  ) => {
    citiesByState.value[key] = cities || [];
    const selectedCity = cities?.find((city) => city.value === location.cidade);
    location.cidade = selectedCity?.value || "";
  };

  const handleStateChange = async (
    state: string,
    location: FormLeadCreateLocation,
    key: number,
  ) => {
    const selectedState = map.data?.find((item) => item.value === state);
    if (!state || !selectedState) {
      resetCities(key, location);
      return;
    }

    try {
      const cities = await map.findCidadesByEstado(selectedState.value);
      updateCities(key, location, cities);
    } catch {
      resetCities(key, location);
    }
  };

  const watchLocation = (key: number) => {
    const location = formData.localizacoes?.find((item) => item.key === key);
    if (!location) return;
    watch(
      () => location.estado,
      (state) => handleStateChange(state, location, key),
      { immediate: true },
    );
  };

  const fillFromCurrentPosition = async (item: FormLeadCreateLocation) => {
    try {
      const geolocation = await getGeolocation();
      const location = formData.localizacoes?.find(
        (current) => current.key === item.key,
      );
      if (!location || !geolocation) return;

      Object.assign(location, {
        rua: geolocation.rua || location.rua,
        cidade: geolocation.cidade || location.cidade,
        estado: geolocation.estado || location.estado,
        numero: geolocation.numero?.toString() || location.numero,
        cep: geolocation.cep || location.cep,
      });
    } catch (error: any) {
      ElMessage.error({
        message: error?.message || error,
        customClass: "!z-[2500]",
        grouping: true,
        plain: true,
      });
    }
  };

  const addLocation = () => {
    const location: FormLeadCreateLocation = {
      key: Date.now(),
      rua: "",
      cidade: "",
      estado: "",
      complemento: "",
      numero: "",
      cep: "",
    };
    formData.localizacoes?.push(location);
    watchLocation(location.key);
  };

  const removeLocation = (location: FormLeadCreateLocation) => {
    const index = formData.localizacoes?.indexOf(location);
    if (index !== undefined && index >= 0) {
      formData.localizacoes?.splice(index, 1);
    }
  };

  const clearCities = () => {
    citiesByState.value = {};
  };

  return {
    cidadesPorEstado: citiesByState,
    clearCities,
    handleAddLocation: addLocation,
    handleEstadoChange: handleStateChange,
    handleLocation: fillFromCurrentPosition,
    handleRemoveLocation: removeLocation,
    resetCidadesPorEstado: resetCities,
    setupWatchForLocation: watchLocation,
    updateCidadesPorEstado: updateCities,
  };
}
