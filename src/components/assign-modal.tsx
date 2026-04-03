"use client";

import { useState } from "react";
import type { Person, PickupEvent } from "@/types/calendar";

interface AssignModalProps {
  pickup: PickupEvent;
  onAssign: (assignee: Person) => void;
  onUnassign: () => void;
  onClose: () => void;
}

export function AssignModal({ pickup, onAssign, onUnassign, onClose }: AssignModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h3 className="text-base font-bold text-center mb-1">
          {pickup.date}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {pickup.type}の担当を選んでください
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onAssign("パパ")}
            className={`
              py-4 rounded-xl text-lg font-bold transition-all active:scale-95
              ${pickup.assignee === "パパ"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
                : "bg-blue-50 text-blue-600 border-2 border-blue-200"
              }
            `}
          >
            パパ
          </button>
          <button
            onClick={() => onAssign("ママ")}
            className={`
              py-4 rounded-xl text-lg font-bold transition-all active:scale-95
              ${pickup.assignee === "ママ"
                ? "bg-pink-500 text-white shadow-lg shadow-pink-200"
                : "bg-pink-50 text-pink-600 border-2 border-pink-200"
              }
            `}
          >
            ママ
          </button>
        </div>

        {pickup.assignee && (
          <button
            onClick={onUnassign}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            担当を外す
          </button>
        )}
      </div>
    </div>
  );
}
