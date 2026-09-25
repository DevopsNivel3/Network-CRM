<script setup lang="ts">
import { LocationFilled, Loading } from "@element-plus/icons-vue";

const props = defineProps<{
  endereco?: string;
  coords?: [number | null, number | null];
}>();

const coords = ref<[number, number] | null>(null);
const location = computed(() => props.endereco);
const isLoading = ref<boolean>(false);

// Watch para atualizar o mapa quando o endereço é alterado
watchEffect(async () => {
  if (
    props.coords &&
    props.coords[0] !== null &&
    props.coords[1] !== null &&
    !isNaN(props.coords[0]) &&
    !isNaN(props.coords[1]) &&
    (props.coords[0] !== 0 || props.coords[1] !== 0)
  )
    return (coords.value = [props.coords[0], props.coords[1]]);
  if (!location.value) return (coords.value = null);

  isLoading.value = true;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location.value
      )}`,
      {
        cache: "force-cache",
      }
    );
    const data = await res.json();

    if (data.length > 0) coords.value = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    else coords.value = null;
  } catch (err) {
    coords.value = null;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <LMap
    class="!w-full !h-36 !rounded-b-md !shadow-md"
    :use-global-leaflet="false"
    :center="coords"
    v-if="coords"
    :max-zoom="18"
    :zoom="15"
  >
    <LTileLayer
      attribution='&amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      name="OpenStreetMap"
      layer-type="base"
    />
    <!-- Marker -->
    <LMarker :lat-lng="coords" />
  </LMap>
  <div
    v-else
    class="flex items-center justify-center w-full h-36 rounded-b-md bg-black/10 dark:bg-white/20 shadow-md"
  >
    <!-- Quando o endereço está sendo buscado -->
    <ElIcon v-if="isLoading" class="is-loading" color="var(--el-color-primary)" size="25">
      <Loading />
    </ElIcon>
    <!-- Quando o endereço não é localizado -->
    <div v-else class="flex gap-2 flex-col items-center justify-center">
      <ElIcon size="25">
        <LocationFilled />
      </ElIcon>
      <p class="text-sm">Nenhum local encontrado</p>
    </div>
  </div>
</template>

<style>
.leaflet-bottom.leaflet-right {
  visibility: hidden !important;
}
</style>
