import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Category from "./components/Category";

import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import AddPocketFlow from "./components/AddPocketFlow";
import TransactionForm from "./components/TransactionForm";
import AddDebtForm from "./components/AddDebtForm";
import Profile from "./components/Profile";
import TransactionDetail from "./components/TransactionDetail";
import PocketDetail from "./components/PocketDetail";
import AllPockets from "./components/AllPockets";
import AccountSettings from "./components/AccountSettings";

export default function App() {
  const [session, setSession] = useState(undefined);

  const [screen, setScreen] = useState({
    name: "dashboard",
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [selectedPocketId, setSelectedPocketId] =
    useState(null);

  const [pocketOrigin, setPocketOrigin] =
    useState("dashboard");

  const goBackFromPocket = () => {
    if (pocketOrigin === "all-pockets") {
      setScreen({ name: "all-pockets" });
    } else {
      goDashboard();
    }
  };

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
          setScreen({ name: "dashboard" });
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
  /* CATEGORY */
  /* ================================================================ */

  if (screen.name === "category") {
    return (
      <Category
        onHome={goDashboard}
        onPocket={() =>
          setScreen({
            name: "all-pockets",
          })
        }
        onBudget={() => {}}
        onProfile={() =>
          setScreen({
            name: "profile",
          })
        }
        onBack={goDashboard}
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
        onOpenPocketsList={() =>
          setScreen({
            name: "all-pockets",
          })
        }
        onOpenCategory={() =>
          setScreen({
            name: "category",
          })
        }
        onOpenBudget={() => {}}
        onOpenAccountSettings={() =>
          setScreen({
            name: "account-settings",
          })
        }
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
  /* ACCOUNT SETTINGS */
  /* ================================================================ */

  if (screen.name === "account-settings") {
    return (
      <AccountSettings
        onBack={() =>
          setScreen({
            name: "profile",
          })
        }
        onAccountDeleted={() => {
          setScreen({
            name: "dashboard",
          });
        }}
      />
    );
  }

  /* ================================================================ */
  /* ALL POCKETS */
  /* ================================================================ */

  if (screen.name === "all-pockets") {
    return (
      <AllPockets
        onOpenPocket={(pocketId) => {
          setSelectedPocketId(pocketId);
          setPocketOrigin("all-pockets");
          setScreen({
            name: "pocket-detail",
          });
        }}
        onAddPocket={() =>
          setScreen({
            name: "add-pocket",
          })
        }
        onHome={goDashboard}
        onOpenCategory={() =>
          setScreen({
            name: "category",
          })
        }
        onOpenBudget={() => {}}
        onOpenProfile={() =>
          setScreen({
            name: "profile",
          })
        }
      />
    );
  }

  /* ================================================================ */
  /* POCKET DETAIL */
  /* ================================================================ */

  if (screen.name === "pocket-detail") {
    return (
      <PocketDetail
        pocketId={selectedPocketId}
        onBack={goBackFromPocket}
        onDeleted={goBackFromPocket}
        onOpenTransaction={(transaction) => {
          setSelectedTransaction(transaction);
          setScreen({
            name: "transaction-detail",
          });
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

      onOpenPocket={(pocketId) => {
        setSelectedPocketId(pocketId);
        setPocketOrigin("dashboard");
        setScreen({
          name: "pocket-detail",
        });
      }}

      onOpenPocketsList={() =>
        setScreen({
          name: "all-pockets",
        })
      }

      onOpenCategory={() =>
        setScreen({
          name: "category",
        })
      }

      onOpenBudget={() => {}}

      onOpenTransaction={(transaction) => {
        setSelectedTransaction(transaction);

        setScreen({
          name: "transaction-detail",
        });
      }}
    />
  );
}
