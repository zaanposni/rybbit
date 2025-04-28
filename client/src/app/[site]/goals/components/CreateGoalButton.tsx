"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Plus } from "lucide-react";
import GoalFormModal from "./GoalFormModal";

interface CreateGoalButtonProps {
  siteId: number;
}

export default function CreateGoalButton({ siteId }: CreateGoalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        <span>Add Goal</span>
      </Button>

      {isModalOpen && (
        <GoalFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          siteId={siteId}
        />
      )}
    </>
  );
}
