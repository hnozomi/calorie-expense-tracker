import { planHref } from "@/components/features/plan/utils/plan-href";
import { WeekSwitcher } from "@/components/ui/week-switcher";
import { formatWeekLabel, shiftDate } from "@/utils";

type Props = {
  weekStart: string;
  thisMonday: string;
};

export const WeekNavigator = ({ weekStart, thisMonday }: Props) => (
  <WeekSwitcher
    label={formatWeekLabel(weekStart)}
    isCurrentWeek={weekStart === thisMonday}
    previousHref={planHref(shiftDate(weekStart, -7), thisMonday)}
    nextHref={planHref(shiftDate(weekStart, 7), thisMonday)}
    currentWeekHref={planHref(thisMonday, thisMonday)}
  />
);
