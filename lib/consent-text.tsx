export const CONSENT_TEXT = (therapist: any, patient: any) => `
La sottoscritta dott.ssa ${therapist.display_name}, iscritta all’Ordine degli Psicologi del Veneto con il n. ${therapist.registration_number}, 
orientamento ${therapist.therapeutic_orientation}, dichiara di aver informato il sig./la sig.ra ${patient.display_name} 
circa le modalità del trattamento, la durata (${patient.session_duration_individual} min individuale, ${patient.session_duration_couple} min coppia, ${patient.session_duration_family} min familiare) 
e i compensi concordati (EUR ${patient.rate_individual}, ${patient.rate_couple}, ${patient.rate_family}).  

[Segue testo legale completo — inserire qui tutto il corpo del documento “Privacy Padova maggio 2025”, 
eventualmente con i tag ${therapist.insurance_policy}, ${patient.birth_place}, ecc.]
`;
