import { useState } from "react";
import Dashboard from "./components/Dashboard";
import AddPocketFlow from "./components/AddPocketFlow";
import TransactionForm from "./components/TransactionForm";
import AddDebtForm from "./components/AddDebtForm";
import Profile from "./components/Profile";

export default function App() {
  const [screen, setScreen] = useState({ name: "dashboard" });
  const goDashboard = () => setScreen({ name: "dashboard" });

  if (screen.name === "add-pocket")
    return <AddPocketFlow onCancel={goDashboard} onSaved={goDashboard} />;
  if (screen.name === "add-transaction")
    return <TransactionForm onCancel={goDashboard} onSaved={goDashboard} />;
  if (screen.name === "add-debt")
    return <AddDebtForm onCancel={goDashboard} onSaved={goDashboard} />;
  if (screen.name === "profile")
    return <Profile onHome={goDashboard} />;

  return (
    <Dashboard
      activeTab="home"
      onAddPocket={() => setScreen({ name: "add-pocket" })}
      onAddTransaction={() => setScreen({ name: "add-transaction" })}
      onAddDebt={() => setScreen({ name: "add-debt" })}
      onOpenProfile={() => setScreen({ name: "profile" })}
      onOpenPocket={() => {}}
    />
  );
}
