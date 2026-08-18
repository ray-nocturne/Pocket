import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Category from "./components/Category";
import Budget from "./components/Budget";

import LoginScreen from "./components/LoginScreen";
import AccountActivated from "./components/AccountActivated";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import AddPocketFlow from "./components/AddPocketFlow";
import TransactionForm from "./components/TransactionForm";
import AddDebtForm from "./components/AddDebtForm";
import Profile from "./components/Profile";
import TransactionDetail from "./components/TransactionDetail";
import PocketDetail from "./components/PocketDetail";
import AllPockets from "./components/AllPockets";
import AccountSettings from "./components/AccountSettings";
import Debts from "./components/Debts";
import DebtDetail from "./components/DebtDetail";
import Transactions from "./components/Transactions";

const SESSION_SCREEN_KEY = "pm_session_screen";

const RESTORABLE_SCREENS = [
  "dashboard",
  "all-pockets",
  "category",
  "budget",
  "profile",
  "transactions",
  "debts",
  "account-settings",
  "add-pocket",
  "add-transaction",
  "add-debt",
  "pocket-detail",
  "debt-detail",
];

function loadPersistedScreen() {
  try {
    const raw = sessionStorage.getItem(SESSION_SCREEN_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!RESTORABLE_SCREENS.includes(parsed.screenName)) return null;

    if (parsed.screenName === "pocket-detail" && !parsed.pocketId) {
      return null;
    }

    if (parsed.screenName === "debt-detail" && !parsed.debtId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [accountActivated, setAccountActivated] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const [screen, setScreen] = useState(() => {
    const persisted = loadPersistedScreen();
    return persisted ? { name: persisted.screenName } : { name: "dashboard" };
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [selectedPocketId, setSelectedPocketId] =
    useState(() => loadPersistedScreen()?.pocketId || null);

  const [selectedDebtId, setSelectedDebtId] =
    useState(() => loadPersistedScreen()?.debtId || null);

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
    if (!session) {
      try {
        sessionStorage.removeItem(SESSION_SCREEN_KEY);
      } catch {}
      return;
    }

    try {
      sessionStorage.setItem(
        SESSION_SCREEN_KEY,
        JSON.stringify({
          screenName: screen.name,
          pocketId: selectedPocketId,
          debtId: selectedDebtId,
        })
      );
    } catch {}
  }, [screen, selectedPocketId, selectedDebtId, session]);

  useEffect(() => {
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );

    const verificationType = hashParams.get("type");
    const isSignupVerification =
      verificationType === "signup";
    const isPasswordRecovery =
      verificationType === "recovery";

    if (isSignupVerification) {
      setAccountActivated(true);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );

      supabase.auth.signOut().catch(() => {});
    }

    if (isPasswordRecovery) {
      setPasswordRecovery(true);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isSignupVerification) {
          setSession(data.session);
        } else {
          setSession(null);
        }
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (isSignupVerification) {
            if (event === "SIGNED_OUT") {
              setSession(null);
            }
            return;
          }

          setSession(newSession);

          if (event === "SIGNED_IN") {
            setScreen({ name: "dashboard" });
          }
        }
      );

    return () =>
      listener.subscription.unsubscribe();
  }, []);

  if (accountActivated) {
    return (
      <AccountActivated
        onContinue={() => {
          setAccountActivated(false);
          setSession(null);
          setScreen({ name: "dashboard" });
        }}
      />
    );
  }

  if (passwordRecovery) {
    return (
      <ResetPassword
        onDone={() => {
          setPasswordRecovery(false);
          supabase.auth.signOut().catch(() => {});
          setSession(null);
          setScreen({ name: "dashboard" });
        }}
      />
    );
  }

  if (session === undefined) {
    return (
      <div className="pm-app">
        Loading...
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
  /* TRANSACTIONS */
  /* ================================================================ */

  if (screen.name === "transactions") {
    return (
      <Transactions
        onBack={goDashboard}
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
  /* DEBT DETAIL */
  /* ================================================================ */

  if (screen.name === "debt-detail") {
    return (
      <DebtDetail
        debtId={selectedDebtId}
        onBack={() =>
          setScreen({
            name: "debts",
          })
        }
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
  /* DEBTS */
  /* ================================================================ */

  if (screen.name === "debts") {
    return (
      <Debts
        onBack={goDashboard}
        onAddDebt={() =>
          setScreen({
            name: "add-debt",
          })
        }
        onOpenDebt={(debtId) => {
          setSelectedDebtId(debtId);
          setScreen({
            name: "debt-detail",
          });
        }}
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
        onBudget={() =>
          setScreen({
            name: "budget",
          })
        }
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
  /* BUDGET */
  /* ================================================================ */

  if (screen.name === "budget") {
    return (
      <Budget
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
        onOpenProfile={() =>
          setScreen({
            name: "profile",
          })
        }
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
        onOpenBudget={() =>
          setScreen({
            name: "budget",
          })
        }
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
        onOpenBudget={() =>
          setScreen({
            name: "budget",
          })
        }
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

      onOpenDebts={() =>
        setScreen({
          name: "debts",
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

      onOpenBudget={() =>
          setScreen({
            name: "budget",
          })
        }

      onOpenTransaction={(transaction) => {
        setSelectedTransaction(transaction);

        setScreen({
          name: "transaction-detail",
        });
      }}

      
      onOpenTransactions={() =>
        setScreen({
          name: "transactions",
        })
      }
    />
  );
}
