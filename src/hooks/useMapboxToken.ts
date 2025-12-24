import { useLocalStorage } from "./useLocalStorage";

export const useMapboxToken = () => {
  const { value: token, setValue: setToken, isLoading } = useLocalStorage<string>(
    "mapbox_token",
    ""
  );

  return {
    token,
    setToken,
    isLoading,
    hasToken: Boolean(token && token.length > 0),
  };
};
