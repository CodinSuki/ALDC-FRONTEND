export interface ConsultationSubmissionPayload {
  fullName: string;
  email: string;
  phone: string;
  preferredPropertyTypeId: number;
  preferredLocation: string;
  budgetRange: string;
  additionalRequirements?: string | null;
}

export const submitConsultationRequest = async (
  payload: ConsultationSubmissionPayload
): Promise<{ consultationRequestId: number; clientId: number | null }> => {
  const response = await fetch('/api/public/consultation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to submit consultation request');
  }

  return {
    consultationRequestId: Number(data.consultationRequestId),
    clientId: data.clientId == null ? null : Number(data.clientId),
  };
};
