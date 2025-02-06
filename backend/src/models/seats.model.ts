type SeatType = {
  id?: number;
  org: string;
  team?: string;
  queryAt: Date;
  created_at: string | null;
  updated_at: string | null;
  pending_cancellation_date: string | null;
  last_activity_at: Date | null;
  last_activity_editor: string | null;
  plan_type: string;
  assignee_id: number;
  createdAt: Date;
  updatedAt: Date;
};

export { SeatType };