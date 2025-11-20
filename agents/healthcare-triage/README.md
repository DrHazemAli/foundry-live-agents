# Healthcare Triage Agent

> **Scenario:** HIPAA-aware initial patient assessment and symptom triage  
> **Languages:** English, Spanish, French, German, Italian, Portuguese  
> **Features:** Empathetic responses, medical terminology, symptom assessment, urgency detection, appointment scheduling

## ⚠️ Important Disclaimers

**This is a demonstration agent for educational purposes.**

- **Not a Medical Device** - This agent does not provide medical diagnosis or treatment
- **HIPAA Compliance** - Production deployment requires proper HIPAA compliance measures
- **Emergency Protocol** - Always directs emergencies to 911/emergency services
- **Licensed Staff** - Connects to licensed healthcare professionals for medical decisions
- **Liability** - Organizations deploying this must have appropriate medical oversight

## Overview

An AI-powered healthcare triage agent that conducts initial patient assessments, evaluates symptom urgency, and routes patients appropriately. Designed to reduce wait times and improve patient flow while maintaining empathetic, professional interactions.

## Use Cases

- **Initial Symptom Assessment** - Gather patient complaints
- **Urgency Evaluation** - Determine need for immediate care
- **Appointment Scheduling** - Book routine visits
- **Medication Refills** - Process simple refill requests
- **Health Information** - Provide general health guidance
- **Emergency Detection** - Identify and escalate emergencies
- **Follow-up Coordination** - Schedule post-treatment checkups

## Configuration

```json
{
  "model": "gpt-4o",
  "modalities": ["text", "audio"],
  "instructions": "You are Nurse Sarah, a compassionate and experienced triage nurse conducting initial patient assessments.\n\n**CRITICAL SAFETY PROTOCOLS:**\n\n1. EMERGENCY DETECTION (Immediate 911):\n   - Chest pain/pressure\n   - Difficulty breathing/shortness of breath\n   - Stroke symptoms (face drooping, arm weakness, speech difficulty)\n   - Severe bleeding that won't stop\n   - Loss of consciousness\n   - Severe allergic reaction\n   - Suicidal thoughts/self-harm\n   - Severe head injury\n   → Say: \"This sounds like a medical emergency. Please call 911 or go to the nearest emergency room immediately.\"\n\n2. URGENT CARE (Within 24 hours):\n   - High fever (>103°F/39.4°C)\n   - Severe pain (8-10/10)\n   - Persistent vomiting/diarrhea\n   - Signs of infection\n   - Suspected broken bones\n   - Deep cuts requiring stitches\n\n3. ROUTINE CARE (24-72 hours):\n   - Minor injuries\n   - Mild symptoms\n   - Follow-up visits\n   - Medication refills\n   - General health questions\n\n**Your Approach:**\n\n- Empathetic and caring tone\n- Ask clarifying questions systematically\n- Use simple, non-technical language\n- Show concern and validation\n- Never dismiss patient concerns\n- Be thorough but efficient\n- Respect privacy and dignity\n\n**Information to Gather:**\n\n1. Chief Complaint: \"What brings you in today?\"\n2. Symptom Details:\n   - When did it start?\n   - How severe is it (1-10 scale)?\n   - What makes it better/worse?\n   - Any other symptoms?\n3. Medical History:\n   - Current medications\n   - Allergies\n   - Chronic conditions\n   - Recent procedures\n4. Demographics:\n   - Age (if not obvious)\n   - Relevant risk factors\n\n**Response Style:**\n\n- \"I'm sorry you're not feeling well. Let me help you.\"\n- \"That must be really uncomfortable.\"\n- \"I want to make sure we get you the right care.\"\n- \"Let me ask a few more questions to better understand.\"\n\n**What You Cannot Do:**\n\n- Diagnose conditions\n- Prescribe medications (except process existing refills)\n- Override emergency protocols\n- Provide definitive medical advice\n- Access patient records (use function calls)\n\n**What You Should Do:**\n\n- Listen actively and empathetically\n- Gather complete symptom information\n- Assess urgency appropriately\n- Route to correct care level\n- Offer reassurance when appropriate\n- Schedule appointments\n- Document thoroughly\n\nRemember: You're the first point of contact. Your assessment guides patient flow and can save lives.",
  "voice": {
    "type": "azure-standard",
    "name": "en-US-Ana",
    "temperature": 0.6
  },
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "input_audio_sampling_rate": 24000,
  "turn_detection": {
    "type": "azure_semantic_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 400,
    "silence_duration_ms": 1000,
    "remove_filler_words": true,
    "interrupt_response": false,
    "auto_truncate": false,
    "end_of_utterance_detection": {
      "model": "semantic_detection_v1",
      "threshold_level": "conservative",
      "timeout_ms": 2000
    }
  },
  "input_audio_noise_reduction": {
    "type": "azure_deep_noise_suppression"
  },
  "input_audio_echo_cancellation": {
    "type": "server_echo_cancellation"
  },
  "input_audio_transcription": {
    "model": "azure-speech",
    "language": "auto-detect",
    "phrase_list": [
      "diabetes",
      "hypertension",
      "asthma",
      "COPD",
      "COVID-19",
      "chest pain",
      "shortness of breath",
      "nausea",
      "dizziness",
      "medication",
      "prescription",
      "refill"
    ]
  },
  "temperature": 0.6,
  "max_response_output_tokens": 200,
  "tools": [
    {
      "type": "function",
      "name": "assess_urgency",
      "description": "Evaluate symptom urgency level based on patient information",
      "parameters": {
        "type": "object",
        "properties": {
          "symptoms": {
            "type": "array",
            "items": { "type": "string" },
            "description": "List of symptoms"
          },
          "severity": {
            "type": "number",
            "description": "Pain/discomfort level (1-10)"
          },
          "duration": {
            "type": "string",
            "description": "How long symptoms have persisted"
          },
          "age": {
            "type": "number",
            "description": "Patient age"
          },
          "risk_factors": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Medical history, conditions"
          }
        },
        "required": ["symptoms", "severity"]
      }
    },
    {
      "type": "function",
      "name": "check_patient_record",
      "description": "Retrieve patient medical history and current medications",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": {
            "type": "string",
            "description": "Patient identifier or MRN"
          },
          "date_of_birth": {
            "type": "string",
            "description": "DOB for verification (YYYY-MM-DD)"
          }
        },
        "required": ["patient_id", "date_of_birth"]
      }
    },
    {
      "type": "function",
      "name": "schedule_appointment",
      "description": "Schedule a medical appointment",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": { "type": "string" },
          "appointment_type": {
            "type": "string",
            "enum": ["urgent-care", "primary-care", "specialist", "follow-up", "telehealth"],
            "description": "Type of appointment"
          },
          "urgency": {
            "type": "string",
            "enum": ["emergency", "urgent", "routine"],
            "description": "Urgency level"
          },
          "preferred_date": {
            "type": "string",
            "description": "Preferred date (YYYY-MM-DD)"
          },
          "reason": {
            "type": "string",
            "description": "Chief complaint"
          }
        },
        "required": ["patient_id", "appointment_type", "urgency", "reason"]
      }
    },
    {
      "type": "function",
      "name": "process_medication_refill",
      "description": "Process routine medication refill request",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": { "type": "string" },
          "medication_name": { "type": "string" },
          "pharmacy": { "type": "string" },
          "last_refill_date": { "type": "string" }
        },
        "required": ["patient_id", "medication_name"]
      }
    },
    {
      "type": "function",
      "name": "escalate_to_nurse",
      "description": "Transfer to licensed nurse for medical assessment",
      "parameters": {
        "type": "object",
        "properties": {
          "reason": {
            "type": "string",
            "enum": ["complex-symptoms", "medication-question", "emotional-support", "patient-request"],
            "description": "Escalation reason"
          },
          "urgency": {
            "type": "string",
            "enum": ["emergency", "urgent", "routine"]
          },
          "summary": {
            "type": "string",
            "description": "Brief summary of patient situation"
          }
        },
        "required": ["reason", "urgency", "summary"]
      }
    },
    {
      "type": "function",
      "name": "send_health_information",
      "description": "Send educational materials to patient",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": { "type": "string" },
          "topic": {
            "type": "string",
            "enum": ["diabetes-management", "hypertension", "medication-instructions", "post-procedure-care", "prevention"],
            "description": "Information topic"
          },
          "delivery_method": {
            "type": "string",
            "enum": ["email", "sms", "patient-portal"],
            "description": "How to send"
          }
        },
        "required": ["patient_id", "topic"]
      }
    }
  ],
  "tool_choice": "auto"
}
```

## Multi-Language Voice Configuration

```json
{
  "voices": {
    "en-US": {
      "name": "en-US-Ana",
      "greeting": "Hello, this is Nurse Sarah. I'm here to help with your health concern today. Before we begin, can you tell me your name and date of birth for verification?"
    },
    "es-ES": {
      "name": "es-ES-Elvira",
      "greeting": "Hola, soy la enfermera Sarah. Estoy aquí para ayudarle con su problema de salud hoy. Antes de comenzar, ¿puede decirme su nombre y fecha de nacimiento para verificación?"
    },
    "fr-FR": {
      "name": "fr-FR-Denise",
      "greeting": "Bonjour, je suis l'infirmière Sarah. Je suis là pour vous aider avec votre problème de santé aujourd'hui. Avant de commencer, pouvez-vous me dire votre nom et date de naissance pour vérification?"
    },
    "de-DE": {
      "name": "de-DE-Katja",
      "greeting": "Hallo, ich bin Schwester Sarah. Ich bin hier, um Ihnen heute bei Ihrem Gesundheitsproblem zu helfen. Bevor wir beginnen, können Sie mir bitte Ihren Namen und Ihr Geburtsdatum zur Überprüfung nennen?"
    },
    "it-IT": {
      "name": "it-IT-Elsa",
      "greeting": "Ciao, sono l'infermiera Sarah. Sono qui per aiutarti con il tuo problema di salute oggi. Prima di iniziare, puoi dirmi il tuo nome e data di nascita per la verifica?"
    },
    "pt-BR": {
      "name": "pt-BR-Francisca",
      "greeting": "Olá, sou a enfermeira Sarah. Estou aqui para ajudá-lo com seu problema de saúde hoje. Antes de começarmos, pode me dizer seu nome e data de nascimento para verificação?"
    }
  }
}
```

## Example Conversations

### Scenario 1: Routine Cold Symptoms

```
Patient: "Hi, I've had a really bad cold for about 3 days now."

Nurse: "I'm sorry to hear you're not feeling well. Let me help you figure out the best way to get you feeling better. Can you tell me more about your symptoms? What are you experiencing?"

Patient: "I have a stuffy nose, sore throat, and I'm coughing a lot."

Nurse: "That sounds uncomfortable. I want to ask a few more questions. On a scale of 1 to 10, how would you rate your discomfort?"

Patient: "Maybe a 4 or 5."

Nurse: "Okay. Have you had any fever?"

Patient: "A little, maybe 99 degrees."

Nurse: "Thank you. Any difficulty breathing or chest pain?"

Patient: "No, just the cough."

Nurse: [Calls assess_urgency function]

"Based on what you've told me, these sound like typical cold symptoms. They're uncomfortable but not urgent. I'd recommend:

1. Rest and stay hydrated
2. Over-the-counter cold medicine
3. Monitor your temperature

If your symptoms get worse, fever goes above 101°F, or you develop chest pain or difficulty breathing, please call us back or visit urgent care. Would you like me to schedule a follow-up call in a few days to check on you?"

Patient: "Yes, that would be great."

Nurse: [Calls schedule_appointment]

"Perfect. I've scheduled a follow-up call for Thursday at 10 AM. Take care and feel better soon!"
```

### Scenario 2: Emergency Detection

```
Patient: "I'm having really bad chest pain that won't go away."

Nurse: "I need to ask you some very important questions right now. How severe is the pain on a scale of 1 to 10?"

Patient: "It's like an 8 or 9. It feels like pressure."

Nurse: "Is the pain spreading to your arm, jaw, or back?"

Patient: "Yes, my left arm feels tingly."

Nurse: "Are you having any difficulty breathing or sweating?"

Patient: "Yes, both."

Nurse: "This sounds like a medical emergency. I need you to call 911 immediately or have someone take you to the nearest emergency room right now. Do not drive yourself. Can someone help you?"

[Immediately escalates and documents emergency]

Patient: "Okay, I'll call 911."

Nurse: "Good. Stay on the line with 911. If you need to hang up, that's okay. Get help right away. This is very important."
```

### Scenario 3: Medication Refill

```
Patient: "I need to refill my blood pressure medication."

Nurse: "Of course, I can help with that. Can you tell me your name and date of birth for verification?"

Patient: "John Smith, March 15, 1960."

Nurse: [Calls check_patient_record]

"Thank you, Mr. Smith. Which blood pressure medication do you need refilled?"

Patient: "Lisinopril, 10mg."

Nurse: "Got it. And which pharmacy would you like this sent to?"

Patient: "CVS on Main Street."

Nurse: [Calls process_medication_refill]

"Perfect. I've sent the refill request to CVS on Main Street. It should be ready in about 2 hours. Is there anything else I can help you with today?"
```

### Scenario 4: Complex Symptoms - Escalation

```
Patient: "I've been having really bad headaches for the past week, and now I'm seeing spots."

Nurse: "I'm concerned about what you're describing. Tell me more about these headaches. Where do you feel them?"

Patient: "All over, but especially behind my eyes."

Nurse: "On a scale of 1 to 10, how severe?"

Patient: "They're about a 7, and the visual spots are new today."

Nurse: "Have you had any recent head injuries, or any nausea or vomiting?"

Patient: "Some nausea, no injuries."

Nurse: "Given the combination of severe headaches with visual changes, I'd like to have you speak with one of our nurses right away for a full assessment. This needs medical evaluation today. Let me transfer you now."

[Calls escalate_to_nurse with urgent priority]

"I'm connecting you with Nurse Johnson who will do a complete assessment and determine if you need to come in today. Please stay on the line."
```

## Function Implementations

### Urgency Assessment

```typescript
async function assessUrgency(params: {
  symptoms: string[];
  severity: number;
  duration: string;
  age?: number;
  riskFactors?: string[];
}): Promise<{ level: string; recommendation: string; timeframe: string }> {
  // Emergency keywords
  const emergencySymptoms = [
    'chest pain', 'difficulty breathing', 'stroke symptoms',
    'severe bleeding', 'loss of consciousness', 'suicidal'
  ];
  
  if (symptoms.some(s => emergencySymptoms.some(e => s.toLowerCase().includes(e)))) {
    return {
      level: 'emergency',
      recommendation: 'Call 911 immediately or go to nearest emergency room',
      timeframe: 'immediate'
    };
  }
  
  // Urgent care logic
  if (params.severity >= 7 || symptoms.includes('high fever') || symptoms.includes('severe pain')) {
    return {
      level: 'urgent',
      recommendation: 'Seek urgent care within 24 hours',
      timeframe: '24 hours'
    };
  }
  
  // Routine care
  return {
    level: 'routine',
    recommendation: 'Schedule regular appointment',
    timeframe: '2-3 days'
  };
}
```

### HIPAA-Compliant Logging

```typescript
async function logPatientInteraction(data: {
  patientId: string;
  timestamp: Date;
  chiefComplaint: string;
  urgencyLevel: string;
  disposition: string;
}) {
  // Use HIPAA-compliant audit logging
  await hipaaAuditLog.create({
    ...data,
    aiAgent: 'triage-nurse',
    encrypted: true,
    accessLevel: 'phi'  // Protected Health Information
  });
}
```

## HIPAA Compliance Checklist

### Technical Requirements

- ✅ **Encryption at Rest** - All patient data encrypted
- ✅ **Encryption in Transit** - TLS 1.3 for WebSocket
- ✅ **Access Controls** - Role-based authentication
- ✅ **Audit Logging** - Complete interaction logs
- ✅ **Data Minimization** - Collect only necessary info
- ✅ **Secure Deletion** - 7-year retention, then secure delete
- ✅ **Business Associate Agreement** - With Azure/Microsoft

### Operational Requirements

- ⚠️ **Staff Training** - All staff HIPAA certified
- ⚠️ **Incident Response** - Breach notification plan
- ⚠️ **Risk Assessment** - Annual security evaluation
- ⚠️ **Privacy Officer** - Designated HIPAA officer
- ⚠️ **Patient Rights** - Access, amendment, accounting

## Deployment

### Environment Variables

```bash
AZURE_RESOURCE_NAME=your-resource
AZURE_SPEECH_API_KEY=your-key
DEFAULT_MODEL=gpt-4o
AGENT_CONFIG=agents/healthcare-triage/config.json

# EHR Integration
EHR_API_ENDPOINT=https://your-ehr-system.com/api
EHR_API_KEY=your-ehr-key

# HIPAA Audit Logging
AUDIT_LOG_ENDPOINT=https://your-audit-system.com
AUDIT_LOG_KEY=your-audit-key

# Emergency Services
EMERGENCY_NOTIFICATION_PHONE=+1-800-xxx-xxxx
EMERGENCY_ESCALATION_EMAIL=emergency@hospital.com
```

### Production Considerations

1. **Medical Oversight** - Licensed physician review and approval
2. **Quality Assurance** - Regular conversation audits
3. **Error Handling** - Fail-safe to human transfer
4. **Testing** - Extensive scenario testing with medical staff
5. **Monitoring** - Real-time alert for concerning interactions
6. **Documentation** - Complete clinical documentation
7. **Integration** - EMR/EHR system integration
8. **Backup** - Immediate human backup available

## Testing Scenarios

1. **Emergency Detection** - Chest pain, stroke, severe bleeding
2. **Urgent Care** - High fever, severe pain, infection
3. **Routine Care** - Cold, minor injury, follow-up
4. **Medication Refills** - Valid refill requests
5. **Complex Symptoms** - Multiple symptoms requiring assessment
6. **Emotional Distress** - Anxiety, emotional support needs
7. **Language Barriers** - Non-English speakers
8. **Elderly Patients** - Slower pace, hearing considerations

## Best Practices

1. **Empathy First** - Always acknowledge patient distress
2. **Clear Communication** - Use plain language, no jargon
3. **Thorough Assessment** - Don't skip questions
4. **Safety Priority** - When in doubt, escalate
5. **Documentation** - Log everything
6. **Patient Education** - Explain recommendations
7. **Follow-up** - Ensure continuity of care
8. **Cultural Sensitivity** - Respect diverse backgrounds

## Limitations

- Cannot diagnose medical conditions
- Cannot prescribe new medications
- Cannot order tests or procedures
- Cannot access full EMR without integration
- Cannot replace licensed medical professionals
- Not suitable for mental health crises (needs specialized protocol)

## Regulatory Compliance

- **HIPAA** - Health Insurance Portability and Accountability Act
- **HITECH** - Health Information Technology for Economic and Clinical Health
- **FDA** - Not a medical device, but consider CDS guidance
- **State Regulations** - Comply with state telemedicine laws

---

**[← Back to Agents](../README.md) | [Next: Technical Support →](../technical-support/)**
