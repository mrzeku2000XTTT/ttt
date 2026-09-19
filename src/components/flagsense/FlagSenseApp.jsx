import React, { useMemo, useState } from "react";
import { Home, Compass, SearchCheck, LineChart, User } from "lucide-react";
import { SCENARIOS } from "@/lib/flagSenseData";
import {
  loadState, saveState, recordAnswer, attachIndex, initCategoryIndex,
} from "@/lib/flagSenseStore";
import FlagSenseOnboarding from "@/components/flagsense/FlagSenseOnboarding";
import FlagSenseSession from "@/components/flagsense/FlagSenseSession";
import FlagSenseCoach from "@/components/flagsense/FlagSenseCoach";
import FlagSayItBetter from "@/components/flagsense/FlagSayItBetter";
import FlagSenseHome from "@/components/flagsense/FlagSenseHome";
import FlagSenseExplore from "@/components/flagsense/FlagSenseExplore";
import FlagSenseReflect from "@/components/flagsense/FlagSenseReflect";
import FlagSenseProgress from "@/components/flagsense/FlagSenseProgress";
import FlagSenseProfile from "@/components/flagsense/FlagSenseProfile";
import { LOGO } from "@/components/flagsense/FlagSenseLanding";
import "./flagSense.css";
import AppHeaderNav from "@/components/AppHeaderNav";

const TABS = [
  { id: "home", icon: Home },
  { id: "explore", icon: Compass },
  { id: "reflect", icon: SearchCheck },
  { id: "progress", icon: LineChart },
  { id: "profile", icon: User },
];

export default function FlagSenseApp() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null); // { feed, mode }
  const [coach, setCoach] = useState(false);
  const [sayIt, setSayIt] = useState(false);

  const catById = useMemo(() => initCategoryIndex(SCENARIOS), []);
  const stateWithIdx = attachIndex(state, catById);

  const update = (next) => setState(saveState(next));

  const handleAnswer = (id, level, mode) =>
    setState((prev) => recordAnswer(prev, id, level, mode));

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };
  const lessonSeen = state.lastLessonDay === todayKey();

  return (
    <div className="flag-sense">
      {!state.onboarded && (
        <FlagSenseOnboarding
          onDone={({ goal, who, interests }) =>
            update({ ...state, onboarded: true, goal, who, interests })
          }
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-md px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-24">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="" className="h-8 w-8 rounded-xl shadow-sm" />
            <span className="text-[16px] font-semibold tracking-tight">FlagSense</span>
          </div>
          <AppHeaderNav appPath="FlagSense" />
        </div>
      </div>

      {tab === "home" && (
        <FlagSenseHome
          state={stateWithIdx}
          onStart={(feed, mode) => setSession({ feed, mode })}
          onOpenTab={setTab}
          lessonSeen={lessonSeen}
          onLessonDone={() => update({ ...state, lastLessonDay: todayKey() })}
          onSayIt={() => setSayIt(true)}
          onCoach={() => setCoach(true)}
        />
      )}
      {tab === "explore" && <FlagSenseExplore state={state} onStart={(feed, mode) => setSession({ feed, mode })} />}
      {tab === "reflect" && <FlagSenseReflect state={stateWithIdx} onStart={(feed, mode) => setSession({ feed, mode })} />}
      {tab === "progress" && <FlagSenseProgress state={stateWithIdx} />}
      {tab === "profile" && (
        <FlagSenseProfile
          state={state}
          onReset={() => {
            if (window.confirm("Reset all FlagSense progress on this device?")) {
              update({ ...loadState(), onboarded: true });
            }
          }}
        />
      )}

      <nav
        aria-label="FlagSense tabs"
        className="fixed bottom-0 inset-x-0 z-[300] border-t border-black/[0.07] bg-[hsl(var(--background)/0.85)] backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex max-w-md">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <Icon className={`h-[18px] w-[18px] ${tab === id ? "text-neutral-900" : "text-neutral-400"}`} />
            </button>
          ))}
        </div>
      </nav>

      {session && (
        <FlagSenseSession
          feed={session.feed}
          mode={session.mode}
          onAnswer={handleAnswer}
          onExit={() => setSession(null)}
        />
      )}
      {coach && <FlagSenseCoach onClose={() => setCoach(false)} />}
      {sayIt && <FlagSayItBetter onClose={() => setSayIt(false)} />}
    </div>
  );
}