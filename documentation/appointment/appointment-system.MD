# Appointment System

This document identifies how the appointment system should work

## Proposal System

### Requirements

`Contact Sitters Page`

1. Customer will be able to choose **ONLY** the services which are provided by the sitter
2. Once customer sends the request the **NEGOTIATION STAGE** Begins

The **CUSTOMER** instiates the process, by propsing a date and time approaching the **SITTER**
The timezone used is the **SITTERS** Timezone

```mermaid
sequenceDiagram 
  actor c as CUSTOMER
  actor s as SITTER 
  Note left of c: Prepare a service proposal
  loop Until Offer is accepted 
    c-->>s: Messages with a service proposal
    alt is accepted 
        s-->>c: Accepts the service   
    else makes counter proposal
        c-->>s:edits offer and resends 
    end
  end
  Note over s,c: Store proposal info,collect payment and make first info
```

## Appointment System ERD

Usecase:

- [ ] When an new proposal is requested an **appoinment** will be created with a **PROPOSAL STATUS** and **appointment_proposal** will contain all the proposals from both parties  
- [ ] **appointment_setting** will store the final result of the negotiated terms, the provider pricing and the dates
- [ ] After propsal is accepted, the appointment dates will be created with **UNPAID_STATUS**

```mermaid
erDiagram

   appointment {
    id lastProposedBy
    boolean isAccepted
    bigint customer_id
    string appointment_state
    id lastProposalBy 
    date endOfLife   
   }

   appointment_proposal {
    int id
    boolean countered
   }
   
   appointment_date {
    bigint id
    datetime appointmentDate
    bigint visitId
    paymentStatus status 
   }
   
   appointment_billing {
    bigint id
    bigint payableTo
    bigint deductedFrom
    payment_category billing_type
    bigint appointment_date_id 
   }

   appointment_setting {
     float ratePrice
     float holidayPrice
     int serviceTypeId 
   }

   visit {
    time startFrom
    time timeTo
    status visitStatus
   }

   appointment||--|{appointment_proposal: has-many 
   appointment|o--||appointment_setting: has-one
   appointment_date||--o|visit: includes
   appointment||--o{appointment_date:has
   appointment_date}o--||appointment_billing:has
```
