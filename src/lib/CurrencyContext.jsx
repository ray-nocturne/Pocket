import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient";
import { formatMoney as formatMoneyRaw } from "./currency";

const CurrencyContext = createContext({
  currency: "IDR",
  numberFormat: "eu",
  showDecimals: false,
  loading: true,
  refreshCurrencySettings: () => {},
  formatMoney: (amount) => formatMoneyRaw(amount, {}),
});

export function CurrencyProvider({ children }) {
  const [settings, setSettings] = useState({
    currency: "IDR",
    numberFormat: "eu",
    showDecimals: false,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("currency, number_format, show_decimals")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setSettings({
          currency: data.currency || "IDR",
          numberFormat: data.number_format || "eu",
          showDecimals: Boolean(data.show_decimals),
        });
      }
    } catch (e) {
      console.error(
        "Failed loading currency settings:",
        e
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const { data: listener } =
      supabase.auth.onAuthStateChange(() => {
        load();
      });

    return () =>
      listener.subscription.unsubscribe();
  }, [load]);

  const value = {
    ...settings,
    loading,
    refreshCurrencySettings: load,
    formatMoney: (amount) =>
      formatMoneyRaw(amount, settings),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
