import { Crown, Gift, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRewardRules, getRewardSummary } from "@/lib/rewards";

export const metadata = { title: "Mama Rewards", robots: { index: false } };

export default async function RewardsPage() {
  const user = await requireUser();
  const [rewards, rules] = await Promise.all([getRewardSummary(user.id), getRewardRules()]);
  const nextTier = rewards.tier === "COCOA" ? { label: "Flame", min: rules.flameThreshold } : rewards.tier === "FLAME" ? { label: "Crown", min: rules.crownThreshold } : null;
  const progressBase = rewards.tier === "FLAME" ? rules.flameThreshold : rewards.tier === "CROWN" ? rules.crownThreshold : 0;
  const progressTarget = nextTier?.min ?? Math.max(rules.crownThreshold, rewards.lifetimePoints || rules.crownThreshold);
  const progress = nextTier ? Math.max(0, Math.min(100, ((rewards.lifetimePoints - progressBase) / Math.max(1, progressTarget - progressBase)) * 100)) : 100;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-cocoa p-6 text-cream shadow-[0_20px_60px_rgba(74,27,12,.14)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-peach"><Sparkles className="size-3.5" /> Mama Rewards</div>
            <h2 className="mt-4 text-4xl text-white sm:text-5xl">{rewards.points.toLocaleString()} points</h2>
            <p className="mt-2 text-sm text-cream/70">Your current balance</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-peach">Current tier</p>
            <p className="mt-1 text-2xl font-semibold text-white">{rewards.tier === "COCOA" ? "Cocoa" : rewards.tier === "FLAME" ? "Flame" : "Crown"}</p>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex justify-between text-xs text-cream/70"><span>{rewards.lifetimePoints.toLocaleString()} lifetime points</span><span>{nextTier ? `${Math.max(0, nextTier.min - rewards.lifetimePoints)} to ${nextTier.label}` : "Top tier unlocked"}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-peach" style={{ width: `${progress}%` }} /></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <RuleCard icon={Gift} title="Paid order" value={`+${rules.paidOrderPoints}`} text="Every successfully paid order" />
        <RuleCard icon={Sparkles} title="Per item" value={`+${rules.perItemPoints}`} text="For every item in that order" />
        <RuleCard icon={Crown} title="Top tier" value={rules.crownThreshold.toLocaleString()} text="Lifetime points to reach Crown" />
      </section>

      {rules.enabled && (
        <section className="rounded-[1.75rem] border border-sand bg-white p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-flame">Use your points</p>
          <h3 className="mt-1 text-3xl text-cocoa">Save at checkout</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">Use at least {rules.minRedeemPoints.toLocaleString()} points. Every {rules.pointsPerPercent.toLocaleString()} points gives 1% off, up to {rules.maxRedeemPercent}% per order.</p>
        </section>
      )}

      <section className="rounded-[1.75rem] border border-sand bg-white p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-flame">Activity</p><h3 className="mt-1 text-3xl text-cocoa">Points history</h3></div>
        </div>

        {rewards.transactions.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-cream p-6 text-center text-sm text-ink-soft">Your rewards activity will appear here after your first eligible paid order.</div>
        ) : (
          <div className="mt-6 divide-y divide-sand">
            {rewards.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div><p className="text-sm font-semibold text-cocoa">{tx.description}</p><p className="mt-1 text-xs text-ink-soft">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
                <span className={`shrink-0 text-sm font-bold ${tx.points >= 0 ? "text-green-700" : "text-flame"}`}>{tx.points >= 0 ? "+" : ""}{tx.points}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] bg-petal p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-flame">How it works</p>
        <h3 className="mt-2 text-2xl text-cocoa">Real points from real purchases.</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">Points are credited only after Stripe confirms a successful payment. Checkout redemptions are server-validated, and cancelled payment sessions return reserved points automatically.</p>
      </section>
    </div>
  );
}

function RuleCard({ icon: Icon, title, value, text }: { icon: typeof Gift; title: string; value: string; text: string }) {
  return <div className="rounded-[1.4rem] border border-sand bg-white p-5"><div className="grid size-10 place-items-center rounded-full bg-petal text-cocoa"><Icon className="size-4.5" /></div><p className="mt-4 text-sm font-semibold text-cocoa">{title}</p><p className="mt-1 text-2xl font-bold text-flame">{value}</p><p className="mt-1 text-xs leading-5 text-ink-soft">{text}</p></div>;
}
