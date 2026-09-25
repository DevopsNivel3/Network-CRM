import pkg from "lodash";
const { debounce } = pkg;

type FilterFn<T> = (item: T) => boolean;
type FetchFn = () => Promise<any>;
type SetQueryFn = (query: string) => void;

// Função para realizar a busca remota progressiva e filtrar a lista
export function useRemoteSearch<T>(
  sourceList: Ref<T[]>,
  filterFn: FilterFn<T> | undefined,
  fetchData: FetchFn,
  setQuery: SetQueryFn,
  delay = 300
) {
  const isLoading = ref<boolean>(false);
  const previousQuery = ref<string>("");

  const filteredList = computed(() =>
    filterFn ? (sourceList.value || []).filter(filterFn) : sourceList.value || []
  );

  const remoteSearch = debounce(async (query: string) => {
    if (query === previousQuery.value) return;
    previousQuery.value = query;

    if (query === "") {
      setQuery("");
      await fetchData();
      return;
    }

    isLoading.value = true;
    setQuery(query);

    try {
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  }, delay);

  return {
    isLoading,
    remoteSearch,
    filteredList,
  };
}
