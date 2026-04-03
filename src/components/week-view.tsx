"use client";

import { useState } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { DayCard } from "./day-card";
import { AssignModal } from "./assign-modal";

interface WeekViewProps {
  days: DaySchedule[];
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
}

export function WeekView({ days, onAssign }: WeekViewProps) {
  const [selectedPickup, setSelectedPickup] = useState<PickupEvent | null>(null);

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 px-2">
        {days.slice(0, 7).map((day) => (
          <DayCard
            key={day.date}
            schedule={day}
            onPickupTap={(pickup) => setSelectedPickup(pickup)}
          />
        ))}
      </div>

      {selectedPickup && (
        <AssignModal
          pickup={selectedPickup}
          onAssign={(person) => {
            onAssign(selectedPickup, person);
            setSelectedPickup(null);
          }}
          onUnassign={() => {
            onAssign(selectedPickup, null);
            setSelectedPickup(null);
          }}
          onClose={() => setSelectedPickup(null)}
        />
      )}
    </>
  );
}
