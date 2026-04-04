export type Person = "とっちゃん" | "かあか";

export type EventCategory =
  | "送迎"
  | "ゴミ"
  | "家族"
  | "川村"
  | "萌香"
  | "その他";

export type PickupType = "送り" | "迎え";

export interface PickupEvent {
  date: string; // YYYY-MM-DD
  type: PickupType;
  assignee: Person | null; // null = 未調整
  googleEventId?: string;
}

export interface PersonalEvent {
  id: string;
  title: string;
  startTime?: string; // HH:MM
  endTime?: string;
  googleEventId?: string;
  isWfh?: boolean; // 在宅勤務（川村カレンダーのみ）
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  pickups: PickupEvent[];
  isWfh: boolean; // 在宅勤務
  trash: TrashType[];
  familyEvents: FamilyEvent[];
  kawamuraEvents: PersonalEvent[];
  moekaEvents: PersonalEvent[];
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
