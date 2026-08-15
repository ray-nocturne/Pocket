import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import AddPocketFlow from "./components/AddPocketFlow";
import TransactionForm from "./components/TransactionForm";
import AddDebtForm from "./components/AddDebtForm";
import Profile from "./components/Profile";
import TransactionDetail from "./components/TransactionDetail";

export default function App() {
  const [session, setSession] = useState(undefined);

  const [screen, setScreen] = useState({
    name: "dashboard",
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const goDashboard = () => {
    setSelectedTransaction(null);
    setScreen({
      name: "dashboard",
    });
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );

    return () =>
      listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="pm-app">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onAuthed={() => {}} />;
  }

  /* ================================================================ */
  /* ADD POCKET */
  /* ================================================================ */

  if (screen.name === "add-pocket") {
    return (
      <AddPocketFlow
        onCancel={goDashboard}
        onSaved={goDashboard}
      />
    );
  }

  /* ================================================================ */
  /* ADD TRANSACTION */
  /* ================================================================ */

  if (screen.name === "add-transaction") {
    return (
      <TransactionForm
        onCancel={goDashboard}
        onSaved={goDashboard}
      />
    );
  }

  /* ================================================================ */
  /* EDIT TRANSACTION */
  /* ================================================================ */

  if (screen.name === "edit-transaction") {
    return (
      <TransactionForm
        transaction={selectedTransaction}
        onCancel={() => {
          setScreen({
            name: "transaction-detail",
          });
        }}
        onSaved={() => {
          goDashboard();
        }}
      />
    );
  }

  /* ================================================================ */
  /* ADD DEBT */
  /* ================================================================ */

  if (screen.name === "add-debt") {
    return (
      <AddDebtForm
        onCancel={goDashboard}
        onSaved={goDashboard}
      />
    );
  }

  /* ================================================================ */
  /* PROFILE */
  /* ================================================================ */

  if (screen.name === "profile") {
    return (
      <Profile
        onHome={goDashboard}
      />
    );
  }

  /* ================================================================ */
  /* TRANSACTION DETAIL */
  /* ================================================================ */

  if (screen.name === "transaction-detail") {
    return (
      <TransactionDetail
        transaction={selectedTransaction}

        onBack={goDashboard}

        onEdit={(transaction) => {
          setSelectedTransaction(transaction);

          setScreen({
            name: "edit-transaction",
          });
        }}

        onDeleted={() => {
          goDashboard();
        }}
      />
    );
  }

  /* ================================================================ */
  /* DASHBOARD */
  /* ================================================================ */

  return (
    <Dashboard
      activeTab="home"

      onAddPocket={() =>
        setScreen({
          name: "add-pocket",
        })
      }

      onAddTransaction={() =>
        setScreen({
          name: "add-transaction",
        })
      }

      onAddDebt={() =>
        setScreen({
          name: "add-debt",
        })
      }

      onOpenProfile={() =>
        setScreen({
          name: "profile",
        })
      }

      onOpenPocket={() => {}}

      onOpenTransaction={(transaction) => {
        setSelectedTransaction(transaction);

        setScreen({
          name: "transaction-detail",
        });
      }}
    />
  );
}