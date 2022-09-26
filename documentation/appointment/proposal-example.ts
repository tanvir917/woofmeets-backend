/* eslint-disable @typescript-eslint/no-unused-vars */
const appointmentProposalStructure = {
  appointment: {
    id: 1,
    status: 'PROPOSAL', // initially they will have to be string values
    payment_status: 'UNPAID',
    timezone: '{{COPY_OF_SITTER_TIMEZONE}}',
    lastestProposal: {
      description:
        'This is a copy of the latest proposal in the appointment table',
      service_id: 2,
      original_proposal: false,
      provider_rate: 200,
      provider_holiday_rate: 200,
      proposed_by: '{{sitter_id}}',
      is_countered: false,
    },
    appointment_proposal: [
      {
        // this is the first proposal by the customer
        service_id: 1,
        provider_rate: 200,
        original_proposal: true,
        provider_holiday_rate: 200,
        proposed_by: '{{customer_id}}',
        ovveriden: true,
        is_countered: true,
        // 'the rest of the proposal info', such as timestamp, updated_at, provider_service_pricing, etc
      },
      {
        // countered proposal by the sitter
        service_id: 2,
        original_proposal: false,
        provider_rate: 200,
        provider_holiday_rate: 200,
        proposed_by: '{{sitter_id}}',
        is_countered: false,
        // 'the rest of the proposal info',
      },
    ],
  },
};
