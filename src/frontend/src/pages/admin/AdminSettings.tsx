import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/context/CurrencyContext";
import { useGroup } from "@/context/GroupContext";
import { useUpdateGroupSettings } from "@/hooks/useQueries";
import { CURRENCIES } from "@/utils/currencies";
import { formatCurrency, formatPercent } from "@/utils/format";
import { Globe, Loader2, Save, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { activeGroup, refreshGroups } = useGroup();
  const updateSettings = useUpdateGroupSettings();
  const { currency, setCurrency } = useCurrency();

  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [penaltyRate, setPenaltyRate] = useState("");

  useEffect(() => {
    if (activeGroup) {
      setMonthlyContribution(String(activeGroup.monthlyContribution));
      setInterestRate(String(activeGroup.interestRatePercent));
      setPenaltyRate(String(activeGroup.penaltyRatePercent));
    }
  }, [activeGroup]);

  async function handleSave() {
    const contrib = Number.parseFloat(monthlyContribution);
    const interest = Number.parseFloat(interestRate);
    const penalty = Number.parseFloat(penaltyRate);

    if (
      Number.isNaN(contrib) ||
      Number.isNaN(interest) ||
      Number.isNaN(penalty)
    ) {
      toast.error("Please enter valid numbers for all fields.");
      return;
    }
    if (contrib <= 0) {
      toast.error("Monthly contribution must be greater than 0.");
      return;
    }
    if (interest < 0 || interest > 100) {
      toast.error("Interest rate must be between 0 and 100%.");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        monthlyContribution: contrib,
        interestRatePercent: interest,
        penaltyRatePercent: penalty,
      });
      refreshGroups();
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure financial parameters for{" "}
          <strong>{activeGroup?.name ?? "this group"}</strong>
        </p>
      </div>

      {/* Currency & Localization Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle">
                <Globe className="h-4 w-4 text-brand" />
              </div>
              <div>
                <CardTitle className="font-display text-base">
                  Currency &amp; Localization
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Choose the currency displayed throughout the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency-select" className="text-sm font-medium">
                Display Currency
              </Label>
              <Select
                value={currency.code}
                onValueChange={(code) => {
                  const selected = CURRENCIES.find((c) => c.code === code);
                  if (selected) setCurrency(selected);
                }}
              >
                <SelectTrigger
                  id="currency-select"
                  className="w-full sm:w-72"
                  data-ocid="settings.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Currency preference is saved locally on this device.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle">
                <Settings className="h-4 w-4 text-brand" />
              </div>
              <div>
                <CardTitle className="font-display text-base">
                  Group Financial Settings
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  These settings apply to all members and new loans created.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!activeGroup ? (
              <p className="text-sm text-muted-foreground">
                No active group selected.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="monthly-contribution"
                    className="text-sm font-medium"
                  >
                    Monthly Contribution Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {currency.symbol}
                    </span>
                    <Input
                      id="monthly-contribution"
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="pl-7"
                      placeholder="e.g. 500"
                      data-ocid="settings.input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fixed amount each member is required to contribute monthly
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="interest-rate"
                    className="text-sm font-medium"
                  >
                    Monthly Loan Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="interest-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="pr-7"
                      placeholder="e.g. 5"
                      data-ocid="settings.input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Interest rate applied monthly to outstanding loan balances
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty-rate" className="text-sm font-medium">
                    Late Payment Penalty Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="penalty-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={penaltyRate}
                      onChange={(e) => setPenaltyRate(e.target.value)}
                      className="pr-7"
                      placeholder="e.g. 2"
                      data-ocid="settings.input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Penalty rate applied to late contributions
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Current Values
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Contribution
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {formatCurrency(
                          activeGroup.monthlyContribution,
                          currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Interest Rate
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {formatPercent(activeGroup.interestRatePercent)}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Penalty Rate
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {formatPercent(activeGroup.penaltyRatePercent)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="bg-brand hover:bg-brand-dark text-white w-full sm:w-auto"
                  data-ocid="settings.save_button"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {updateSettings.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
