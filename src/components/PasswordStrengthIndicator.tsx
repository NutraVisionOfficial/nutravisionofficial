import { Check, X } from "lucide-react";
import { validatePassword, getStrengthLabel, type PasswordValidation } from "@/lib/passwordValidation";
import { Progress } from "@/components/ui/progress";

interface Props {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null;

  const validation = validatePassword(password);
  const strength = getStrengthLabel(validation.score);
  const progressValue = (validation.score / 6) * 100;

  return (
    <div className="space-y-2 mt-2 animate-fade-in">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className={`font-medium ${strength.color}`}>{strength.label}</span>
      </div>
      <Progress value={progressValue} className="h-1.5" />
      <ul className="space-y-1">
        {validation.checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.passed ? (
              <Check className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.passed ? "text-muted-foreground" : "text-foreground"}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { validatePassword };
