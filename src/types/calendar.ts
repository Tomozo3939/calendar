export type Person = "パパ" | "ママ";

export type EventCategory =
  | "送迎"
  | "在宅"
  | "ゴミ"
  | "家族"
  | "その他";

export type PickupType = "送り" | "迎え";

export interface PickupEvent {
  date: string; // YYYY-MM-DD
  type: PickupType;
  assignee: Person | null; // null = 未調整
  googleEventId?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  pickups: PickupEvent[];
  isWfh: boolean; // 在宅勤務
  trash: TrashType[];
  familyEvents: FamilyEvent[];
  isHoliday: boolean;
}

export type TrashType = "燃えるゴミ" | "カンビン" | "ペットボトル";

export interface FamilyEvent {
  id: string;
  title: string;
  startTime?: string; // HH:MM
  endTime?: string;
  googleEventId?: string;
}

export interface WeekSummary {
  days: DaySchedule[];
  unresolvedCount: number;
}

// Google Calendar のカレンダーID管理
export interface CalendarIds {
  pickup: string;   // 送迎
  wfh: string;      // 在宅
  trash: string;    // ゴミ
  family: string;   // 家族
}
