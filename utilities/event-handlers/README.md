# Event Handlers

TypeScript type definitions, helper functions, validation utilities, and mock event generators for Azure Speech Voice Live API events.

## Features

- Complete TypeScript type definitions for all events
- Event validation and parsing
- Mock event generators for testing
- Event filtering utilities
- Type guards and assertions

## Installation

```bash
npm install
```

## Usage

### Type Definitions
```typescript
import { 
  SessionCreatedEvent, 
  ResponseTextDeltaEvent,
  FunctionCallEvent,
  VoiceLiveEvent
} from './types';

function handleEvent(event: VoiceLiveEvent) {
  switch (event.type) {
    case 'session.created':
      const session = event as SessionCreatedEvent;
      console.log('Session ID:', session.session.id);
      break;
    
    case 'response.text.delta':
      const delta = event as ResponseTextDeltaEvent;
      process.stdout.write(delta.delta);
      break;
  }
}
```

### Event Validation
```typescript
import { validateEvent, isValidEventType } from './validators';

const event = JSON.parse(message);

if (isValidEventType(event.type)) {
  const validated = validateEvent(event);
  if (validated.valid) {
    handleEvent(validated.event);
  } else {
    console.error('Validation errors:', validated.errors);
  }
}
```

### Mock Event Generators (Testing)
```typescript
import { MockEventGenerator } from './mock-generator';

const generator = new MockEventGenerator();

// Generate mock events for testing
const sessionCreated = generator.sessionCreated('test-session-id');
const textDelta = generator.textDelta('Hello', 'resp-123');
const functionCall = generator.functionCall('get_weather', { location: 'SF' });

// Simulate event stream
for await (const event of generator.stream()) {
  handleEvent(event);
}
```

### Event Filtering
```typescript
import { EventFilter } from './filters';

const filter = new EventFilter();

// Filter specific event types
filter.include(['response.text.delta', 'response.text.done']);

// Filter by response ID
filter.byResponseId('resp-123');

// Apply filter
const events = [...]; // array of events
const filtered = filter.apply(events);
```

## API Reference

### Type Definitions

All Voice Live API events are typed:
- `SessionCreatedEvent`
- `SessionUpdatedEvent`
- `ResponseCreatedEvent`
- `ResponseTextDeltaEvent`
- `ResponseTextDoneEvent`
- `ResponseAudioDeltaEvent`
- `ResponseAudioDoneEvent`
- `ResponseFunctionCallEvent`
- `InputAudioBufferSpeechStartedEvent`
- `InputAudioBufferSpeechStoppedEvent`
- `And 20+ more...`

### Validators

- `validateEvent(event)` - Validate event structure
- `isValidEventType(type)` - Check if event type is valid
- `validateSessionConfig(config)` - Validate session configuration
- `validateFunctionDefinition(func)` - Validate function schema

### Mock Generator

- `sessionCreated(id)` - Generate session.created event
- `textDelta(delta, responseId)` - Generate text delta event
- `functionCall(name, args)` - Generate function call event
- `stream()` - Generate continuous event stream
- `error(message, code)` - Generate error event

### Filters

- `include(types)` - Include specific event types
- `exclude(types)` - Exclude specific event types
- `byResponseId(id)` - Filter by response ID
- `byItemId(id)` - Filter by conversation item ID
- `apply(events)` - Apply filter to event array
