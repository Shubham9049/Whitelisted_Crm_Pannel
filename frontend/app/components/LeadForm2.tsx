"use client";

import LeadForm from "./LeadForm";

interface LeadFormProps {
  onSuccess?: () => void;
}

export default function LeadForm2({ onSuccess }: LeadFormProps) {
  return <LeadForm compact onSuccess={onSuccess} />;
}
